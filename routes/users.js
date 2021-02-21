const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const passport = require("passport");
const User = require("../models/user");
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { isLoggedIn, isLoggedOut, isUserProfile, searching } = require("../middleware");

const multer = require("multer");
const { storage, cloudinary } = require("../cloudinary");
const upload = multer({ storage });

// Display Register form
router.get("/register", isLoggedOut, (req, res) => {
    res.render("users/register");
});

// Register Logic
router.post("/register", upload.single("image"), catchAsync(async (req, res, next) => {
    try {
        const { name, username, email, password } = req.body;
        const user = new User({ name, username, email });
        if (req.file) {
            const { path, filename } = req.file;
            user.image = { url: path, filename: filename };
        } else { // Adding a default image if not image added.
            user.image = {
                url: "https://res.cloudinary.com/mary97mr/image/upload/v1611525637/Twitter/default-picture_vv9tul.png",
                filename: "Twitter/default-picture_vv9tul.png"
            }
        }
        const createdUser = await User.register(user, password);
        // Following all the users by default
        const users = await User.find({ username: { $ne: createdUser.username } });
        for (let user of users) {
            user.followers.push(createdUser); 
            createdUser.following.push(user); 
            createdUser.timeline.push(...user.tweets);
            await user.save();
        }
        await createdUser.save();
        // After registering a user, user already login.
        req.login(createdUser, err => {
            if (err) return next(err)
            req.flash("success", "Welcome to social media.")
            res.redirect("/twitter/home");
        });
    } catch(err) {
        req.flash("error", err.message);
        res.redirect("/register/");
    }
}));

//Display Login form
router.get("/login", isLoggedOut, (req, res) => {
    res.render("users/login");
});

// Login Logic
router.post("/login", passport.authenticate("local", { failureFlash: true, failureRedirect: "/login" }), async (req, res) => {
    // To login we use a method from passport, so we need to require it.
    // passport.authenticate() This mehtod compares the data for us.
    req.flash("success", "Welcome back to social media.")
    res.redirect("/twitter/home/");
});

// Logout logic
router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "Come back Soon");
    res.redirect("/login");
});

// Display User Profile 
router.get("/users/:username", isLoggedIn, searching, catchAsync(async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username: username }).populate({
            path: "tweets followers following",
            populate: {
                path: "author parent retweetStatus retweets",
                populate: {
                    path: "author parent retweets",
                    populate: { path: "author" }
                }
            }
        });
        if (!user) {
            req.flash("error", "Couldnt find user, try again.");
            return res.redirect("/twitter/home");
        }
        res.render("users/profile", { user, tweets: user.tweets });
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/twitter/home");
    }
}));

// Update User Profile 
router.put("/users/:username", isLoggedIn, isUserProfile, upload.single("image"), catchAsync(async (req, res) => {
    const userUpdated = await User.findOneAndUpdate({ username :  req.params.username}, req.body.user);
    if (req.file) {
        cloudinary.uploader.destroy(userUpdated.image.filename); //Deleting actual picture from cloudinary
        const { path, filename } = req.file;
        userUpdated.image = { url: path, filename: filename };
    }
    await userUpdated.save();
    req.flash("success", "Updated profile.");
    res.redirect(`/users/${userUpdated.username}`);
}));

// Following user logic
router.get("/follow/:userId", isLoggedIn, catchAsync(async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id).populate("timeline");
        const user = await User.findById(req.params.userId).populate("followers tweets");
        // Checks if currentuser is in user.followers array
        const follower = user.followers.some(follower => { return follower.equals(currentUser._id) });
        // Checks if user is in current user following array
        const following = currentUser.following.some(following => { return following.equals(user._id) });

        if (!follower && !following) {
            user.followers.push(currentUser); 
            currentUser.following.push(user); 
            currentUser.timeline.push(...user.tweets);
            req.flash("success", `You're now following to ${user.username}`);
        } else {
            user.followers.pull(currentUser._id);
            currentUser.following.pull(user._id);
            for (let tweet of user.tweets) {
                currentUser.timeline.pull(tweet._id);
            }
            req.flash("error", `Unfollowed to ${user.username}`);
        }
        user.save();
        currentUser.save();
        res.redirect("back");
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("back");
    }
}));

// Display forgot password form
router.get("/forgot", (req, res) => {
    res.render("users/forgot");
});

// Forgot password logic
router.post("/forgot", function(req, res, next) {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, (err, buf) => {
                let token = buf.toString("hex");
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({ email: req.body.email }, function(err, user) {
                if (!user) {
                    req.flash("error", "No account with that email address exists.");
                    return res.redirect("/forgot");
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            const smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "yelpcodinginfo@gmail.com",
                    pass: process.env.GMAILPW
                }
            });
            const mailOptions = {
                to: user.email,
                from: "yelpcodinginfo@gmail.com",
                subject: "Twitter Clone Password Reset",
                text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n 
                Please click on the following link, or paste this into your browser to complete the process:\n\n
                http://${req.headers.host}/reset/${token} \n\n 
                If you did not request this, please ignore this email and your password will remain unchanged.\n`
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                console.log("mail sent");
                req.flash("success", `An email has been sent to ${user.email} with further instructions.`);
                done(err, "done");
            });
        }
    ], function(err) {
        if(err) return next(err);
        res.redirect("/forgot");
    });
});

// Display Reset password form
router.get("/reset/:token", async (req, res) => {
    const { token } = req.params;
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });
    if(!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot");
    }
    res.render("users/reset", { token });
});


router.post("/reset/:token", (req, res) => {
    async.waterfall([
        function(done) {
            User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: { $gt: Date.now() }
            }, function (err, user) {
                if(!user) {
                    req.flash("error", "Password reset token is invalid or has expired.");
                    return res.redirect("back");
                }
                if(req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, err => {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;
    
                        user.save(function(err) {
                            req.logIn(user,  err => {
                                done(err, user);
                            });
                        });
                    });
                } else {
                    req.flash("error", "Passwords do not match");
                    return res.redirect("back");
                }
            });
        },
        function(user, done) {
            const smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "yelpcodinginfo@gmail.com",
                    pass: process.env.GMAILPW
                }
            });
            const mailOptions = {
                to: user.email,
                from: "yelpcodinginfo@gmail.com",
                subject: "Your password has been changed.",
                text: `Hello, \n\n
                This is a comfirmation that the password for your account ${user.email} has just been changed.`
            };
            smtpTransport.sendMail(mailOptions, (err) => {
                req.flash("success", "Success! Your password has been changed.");
                done(err);
            });
        }
    ], function(err) {
        res.redirect("/twitter/home");
    });
});

module.exports = router;

