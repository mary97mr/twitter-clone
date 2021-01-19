const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const Tweet = require("../models/tweet");
const { isLoggedIn, validateTweet, isAuthor } = require("../middleware");

// ------- Tweets Routes------//
// INDEX ROUTE
router.get("/", async (req, res) => {
    const allTweets = await Tweet.find({}).populate("author");
    res.render("tweets/index", { tweets: allTweets });
});

// NEW ROUTE (NOT USING THIS FORM TEMPLATE)
router.get("/new", isLoggedIn, (req, res) => {
    res.render("tweets/new");
});

// CREATE ROUTE
router.post("/", validateTweet, isLoggedIn, catchAsync(async (req, res, next) => {
    const tweet = new Tweet(req.body.tweet);
    tweet.author = req.user; // Now every post created will have associate an author.
    await tweet.save();
    req.flash("success", "Successfully created a new post");
    res.redirect(`/tweets/${tweet._id}`)
}));

// SHOW ROUTE
router.get("/:id", catchAsync(async (req, res) => {
    const tweet = await Tweet.findById(req.params.id).populate({
        path: "comments",
        populate: { path: "author"} //this populate author is from the Comment model
    }).populate("author"); //this populate author is from the tweet model
    if(!tweet) {
        req.flash("error", "Cannot find that post");
        res.redirect("/tweets");
    }
    res.render("tweets/show", { tweet });
}));

// EDIT ROUTE
router.get("/:id/edit", isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const tweet = await Tweet.findById(req.params.id);
    if(!tweet) {
        req.flash("error", "Cannot find that post");
        res.redirect("/tweets");
    }
    res.render("tweets/edit", { tweet });
}));

// UPDATE ROUTE
router.put("/:id", validateTweet, isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const updatedTweet = await Tweet.findByIdAndUpdate(req.params.id, req.body.tweet);
    req.flash("success", "Successfully updated your post");
    res.redirect(`/tweets/${updatedTweet._id}`)
}));

// DELETE ROUTE
router.delete("/:id",isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    await Tweet.findByIdAndDelete(req.params.id);
    req.flash("success", "Successfully deleted your post");
    res.redirect("/tweets")
}));


module.exports = router;