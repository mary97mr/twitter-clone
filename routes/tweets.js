const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const Tweet = require("../models/tweet");
const User = require("../models/user");
const { deleteTweet } = require("../public/js/utils.js");
const { isLoggedIn, validateTweet, isAuthor } = require("../middleware");

//Multer is a middleware that divides our req.body and req.files => [{info pic1},{info pic2},{}...]
const multer = require("multer"); 
const { storage } = require("../cloudinary");
const upload = multer({ storage }); // Now pics will be save in our storage.

// ------- Tweets Routes------//

// CREATE ROUTE
router.post("/", isLoggedIn, upload.array("image"), validateTweet, catchAsync(async (req, res, next) => {
    const tweet = new Tweet(req.body.tweet);
    const currentUser = await User.findById(req.user._id);
    // The images are store in req.files. In order we define our tweet model, we need to pass them also the pictures.
    // As req.files is an array we loop throught it. Of every file we create and obj with the params needed.
    tweet.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    tweet.author = currentUser._id; // Now every post created will have associate an author.
    await tweet.save();
    // Save the tweet created in user tweets array
    currentUser.tweets.unshift(tweet);
    currentUser.save();
    req.flash("success", "Successfully created a new post");
    res.redirect(`/tweets/${tweet._id}`)
}));

// SHOW ROUTE
router.get("/:id", catchAsync(async (req, res) => {
    let retweetedBy = null;
    let tweet = await Tweet.findById(req.params.id).populate("author retweets").populate({
        path: "replies parent",
        populate: { path: "author retweets" }
    })
    if(!tweet) {
        req.flash("error", "Cannot find that post");
        return res.redirect("/twitter/home");
    }
    // If retweetStatus !== null, replace tweet for retweetStatus obj
    if (tweet.retweetStatus) {
        retweetedBy = tweet.author;
        tweet = await Tweet.findById(tweet.retweetStatus._id).populate("author retweets").populate({
            path: "replies parent",
            populate: { path: "author retweets" }
        })
    }
    res.render("tweet", { tweet, retweetedBy });
}));

// DELETE ROUTE
router.delete("/:id", isAuthor, catchAsync(async (req, res) => {
    deleteTweet(req.params.id);
    req.flash("success", "Successfully deleted your post");
    res.redirect("/twitter/home")
}));

// Likes Logic
router.post("/:id/like", isLoggedIn, catchAsync(async (req, res, next) => {
    try {
        const tweet = await Tweet.findById(req.params.id);
        // Checks if currentuser is in tweet.likes array
        const userLike = await tweet.likes.some(like => { return like.equals(req.user._id) })
        if (userLike) {
            tweet.likes.pull(req.user._id);
            req.flash("success", "Unlike")
        } else {
            tweet.likes.push(req.user);
            req.flash("success", "You liked the post")
        }
        await tweet.save();
        return res.redirect("back")
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("back");
    }
}));

// Retweet Logic 
router.post("/:id/retweet", isLoggedIn, catchAsync(async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.id).populate("retweets");
        const currentUser = await User.findById(req.user._id);
        // find retweet obj by the author
        const retweet = await tweet.retweets.find(retweet => {
            return retweet.author.equals(currentUser._id)
        });
        if (retweet) {
            // remove from user.tweets and tweet.retweets array
            await currentUser.tweets.pull(retweet._id);
            await tweet.retweets.pull(retweet._id);
            // Delete 
            await Tweet.findByIdAndDelete(retweet._id);
            req.flash("success", "no retweet")
        } else {
            const newRetweet = new Tweet({
                author: currentUser._id,
                retweetStatus: tweet,
            });
            await newRetweet.save();
            await currentUser.tweets.unshift(newRetweet);
            await tweet.retweets.unshift(newRetweet);
            req.flash("success", "retweet");
        }
        await currentUser.save();
        await tweet.save();
        res.redirect("back");
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("back");
    }
}));

module.exports = router;