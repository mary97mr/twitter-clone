const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const passport = require("passport");
const User = require("../models/user");
const Tweet = require("../models/tweet");
const { isLoggedIn, isUserProfile } = require("../middleware");

const multer = require("multer");
const { storage, cloudinary } = require("../cloudinary");
const upload = multer({ storage });

//_____ Register form
router.get("/register", (req, res) => {
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
router.get("/login", (req, res) => {
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
router.get("/logout", isLoggedIn, (req, res) => {
    req.logout();
    req.flash("success", "Come back Soon");
    res.redirect("/twitter/home");
});

// Profile user page
router.get("/:userId", isLoggedIn, catchAsync(async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        const tweets = await Tweet.find().where("author").equals(user._id).populate("author");
        res.render("users/profile", { user, tweets });
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/twitter/home")
    }
}));

// Update profile user page
router.put("/:userId", isLoggedIn, isUserProfile, upload.single("image"),catchAsync(async (req, res) => {
    const { userId } = req.params;
    const userUpdated = await User.findByIdAndUpdate(userId, req.body.user);
    if (req.file) {
        cloudinary.uploader.destroy(userUpdated.image.filename); //Deleting actual picture from cloudinary
        const { path, filename } = req.file;
        userUpdated.image = { url: path, filename: filename };
    }
    await userUpdated.save();
    req.flash("success", "Updated profile.");
    res.redirect(`/${userUpdated.id}`);
}));
module.exports = router;

