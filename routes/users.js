const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const passport = require("passport");
const User = require("../models/user");
const { isLoggedIn, isLoggedOut, isUserProfile, searching } = require("../middleware");

const multer = require("multer");
const { storage, cloudinary } = require("../cloudinary");
const upload = multer({ storage });

//_____ Register form
router.get("/register", isLoggedOut, (req, res) => {
    res.render("users/register");
});
// Register Logic
router.post("/register", upload.single("image"), catchAsync(async (req, res, next) => {
    // First we define the inputs stored in req.body
    // We create a new user with the inputs defined but no the password.
    // Use register(new user, password), method that comes from passport-local-mongoose(in user model)
    try {
        const { name, username, email, password } = req.body;
        const user = new User({ name, username, email });
        if (req.file) {
            const { path, filename } = req.file;
            user.image = { url: path, filename: filename };
        } else { //Adding a default image if not image added.
            user.image = {
                url: "https://res.cloudinary.com/mary97mr/image/upload/v1611525637/Twitter/default-picture_vv9tul.png",
                filename: "Twitter/default-picture_vv9tul.png"
            }
        }
        const createdUser = await User.register(user, password);
        // After registering a user, we want user already login.
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

//______Login form
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

//_____Logout logic
router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "Come back Soon");
    res.redirect("/login");
});

// Profile user page
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

// Update profile user page
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

        if (!follower && !following) { //not found follower in user followers
            user.followers.push(currentUser); // push currentUser to user followers
            currentUser.following.push(user); //push user to currentUser following
            currentUser.timeline.push(...user.tweets);
            req.flash("success", `You're now following to ${user.username}`)
        } else {
            user.followers.pull(currentUser._id) //user found, remove currentUser 
            currentUser.following.pull(user._id) //remove user from currentUser 
            for (let tweet of user.tweets) {
                currentUser.timeline.pull(tweet._id)
            }
            req.flash("error", `Unfollowed to ${user.username}`)
        }
        user.save();
        currentUser.save()
        res.redirect("back")
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("back")
    }
}));

module.exports = router;

