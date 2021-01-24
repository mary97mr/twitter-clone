const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn } = require("../middleware");
const passport = require("passport");
const User = require("../models/user");

//_____ Register form
router.get("/register", (req, res) => {
    res.render("users/register");
});
// Register Logic
router.post("/register", catchAsync(async (req, res, next) => {
    // First we define the inputs stored in req.body
    // We create a new user with the inputs defined but no the password.
    // Use register(new user, password), method that comes from passport-local-mongoose(in user model)
    try {
        const { name, username, email, password } = req.body;
        const user = await new User({name, username, email})
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
router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "Come back Soon");
    res.redirect("/twitter/home");
});

module.exports = router;

