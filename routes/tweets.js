const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const Tweet = require("../models/tweet");
const User = require("../models/user");
const { deleteTweet, addTimeline } = require("../public/js/utils.js");
const { isLoggedIn, validateTweet, isAuthor, searching } = require("../middleware");

const multer = require("multer"); 
const { storage } = require("../cloudinary");
const upload = multer({ storage }); // Now pics will be save in our storage.

// ------- TWEET ROUTES------//

// Create Route
router.post("/", isLoggedIn, upload.array("image"), validateTweet, catchAsync(async (req, res) => {
    const tweet = new Tweet(req.body.tweet);
    const currentUser = await User.findById(req.user._id).populate({
        path: "followers",
        populate: { path: "timeline" }
    });
    tweet.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    tweet.author = currentUser._id; // Now every post created will have associate an author.
    await tweet.save();
    // Add tweet to timeline of followers
    addTimeline(currentUser, tweet);
    // Add tweet in user tweets 
    currentUser.tweets.unshift(tweet);
    currentUser.save();
    req.flash("success", "Successfully created a new post");
    res.redirect(`/tweets/${tweet._id}`)
}));

// Show Route
router.get("/:id", isLoggedIn, searching, catchAsync(async (req, res) => {
    const tweet = await Tweet.findById(req.params.id).populate("author retweets").populate({
        path: "replies parent retweetStatus",
        populate: { path: "author retweets" }
    })
    if(!tweet) {
        req.flash("error", "Cannot find that post");
        return res.redirect("/twitter/home");
    }
    res.render("tweet", { tweet });
}));

// Delete Route
router.delete("/:id", isAuthor, catchAsync(async (req, res) => {
    deleteTweet(req.params.id);
    req.flash("success", "Successfully deleted your post");
    res.redirect("/twitter/home")
}));

// Create Reply Route
router.post("/:id", isLoggedIn, upload.array("image"), validateTweet, catchAsync(async (req, res, next) => {
    const tweet = await Tweet.findById(req.params.id).populate("replies");
    const currentUser = await User.findById(req.user._id).populate({
        path: "followers",
        populate: { path: "timeline" }
    });
    // create and save reply
    const replyTweet = new Tweet(req.body.tweet);
    replyTweet.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    replyTweet.author = currentUser._id;
    replyTweet.parent = tweet;
    await replyTweet.save();
    // Add reply to timeline
    addTimeline(currentUser, replyTweet);
    // Add reply into tweet replies and save
    await tweet.replies.push(replyTweet);
    await tweet.save();
    // Add replyTweet into user tweets and save
    await currentUser.tweets.unshift(replyTweet);
    await currentUser.save();

    req.flash("success", "Successfully created a new post");
    res.redirect(`/tweets/${tweet._id}`)
}));

// Likes Logic Route
router.post("/:id/like", isLoggedIn, catchAsync(async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.id);
        const userLike = await tweet.likes.some(like => { return like.equals(req.user._id) })
        if (userLike) {
            tweet.likes.pull(req.user._id);
        } else {
            tweet.likes.push(req.user);
        }
        await tweet.save();
        res.redirect("back")
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("back");
    }
}));

// Retweet Logic Route
router.post("/:id/retweet", isLoggedIn, catchAsync(async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.id).populate("retweets");
        const currentUser = await User.findById(req.user._id).populate({
            path: "followers",
            populate: { path: "timeline" }
        });
        // find retweet obj by the author
        const retweet = await tweet.retweets.find(retweet => {
            return retweet.author.equals(currentUser._id)
        });
        if (retweet) {
            // remove from user.tweets and tweet.retweets array
            await currentUser.tweets.pull(retweet._id);
            await tweet.retweets.pull(retweet._id);
            await currentUser.timeline.pull(retweet._id);
            for (let follower of currentUser.followers) {
                follower.timeline.pull(retweet._id);
                follower.save();
            }
            // Delete Retweet
            await Tweet.findByIdAndDelete(retweet._id);
        } else {
            const newRetweet = new Tweet({
                author: currentUser._id,
                retweetStatus: tweet,
            });
            await newRetweet.save();
            addTimeline(currentUser, newRetweet);
            await currentUser.tweets.unshift(newRetweet);
            await tweet.retweets.unshift(newRetweet);
        }
        await currentUser.save();
        await tweet.save();
        res.redirect("back");
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("back");
    }
}));

// Share Route
router.post("/:id/share", catchAsync(async (req, res) => {
    req.flash("success", "Tweet link copied to clipboard");
    res.redirect("back")
}));

module.exports = router;