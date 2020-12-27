const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const Tweet = require("../models/tweet");
const { tweetSchema } = require("../schemas");

// Joi validation middleware
const validateTweet = (req, res, next) => {
    const { error } = tweetSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(",")
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

// ------- Tweets Routes------//
// INDEX ROUTE
router.get("/", async (req, res) => {
    const allTweets = await Tweet.find({});
    res.render("tweets/index", { tweets: allTweets });
});

// NEW ROUTE
router.get("/new", (req, res) => {
    res.render("tweets/new");
});

// CREATE ROUTE
router.post("/", validateTweet, catchAsync(async (req, res, next) => {
    const tweetCreated = new Tweet(req.body.tweet);
    await tweetCreated.save();
    res.redirect(`/tweets/${tweetCreated._id}`)
}));

// SHOW ROUTE
router.get("/:id", catchAsync(async (req, res) => {
    const tweet = await Tweet.findById(req.params.id).populate("comments");
    res.render("tweets/show", { tweet });
}));

// EDIT ROUTE
router.get("/:id/edit", catchAsync(async (req, res) => {
    const tweet = await Tweet.findById(req.params.id);
    res.render("tweets/edit", { tweet });
}));

// UPDATE ROUTE
router.put("/:id", validateTweet, catchAsync(async (req, res) => {
    const updatedTweet = await Tweet.findByIdAndUpdate(req.params.id, req.body.tweet)
    res.redirect(`/tweets/${updatedTweet._id}`)
}));

// DELETE ROUTE
router.delete("/:id", catchAsync(async (req, res) => {
    await Tweet.findByIdAndDelete(req.params.id)
    res.redirect("/tweets")
}));


module.exports = router;