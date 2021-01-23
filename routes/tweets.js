const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const Tweet = require("../models/tweet");
const { isLoggedIn, validateTweet, isAuthor } = require("../middleware");

//Multer is a middleware that divides our req.body and req.files => [{info pic1},{info pic2},{}...]
const multer = require("multer"); 
const { storage } = require("../cloudinary");
const upload = multer({ storage }); // Now pics will be save in our storage.


// ------- Tweets Routes------//
// INDEX ROUTE
router.get("/", async (req, res) => {
    const allTweets = await Tweet.find({}).populate("author");
    res.render("tweets/index", { tweets: allTweets });
});

// CREATE ROUTE
router.post("/", isLoggedIn, upload.array("image"), validateTweet, catchAsync(async (req, res, next) => {
    const tweet = new Tweet(req.body.tweet);
    // The images are store in req.files. In order we define our tweet model, we need to pass them also the pictures.
    // As req.files is an array we loop throught it. Of every file we create and obj with the params needed.
    tweet.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    tweet.author = req.user._id; // Now every post created will have associate an author.
    await tweet.save();
    req.flash("success", "Successfully created a new post");
    res.redirect(`/tweets/${tweet._id}`)
}));

// SHOW ROUTE
router.get("/:id", catchAsync(async (req, res) => {
    const tweet = await Tweet.findById(req.params.id).populate({
        path: "replies",
        populate: { path: "author" }
    }).populate("author"); //this populate author is from the tweet model
    if(!tweet) {
        req.flash("error", "Cannot find that post");
        res.redirect("/tweets");
    }
    res.render("tweets/show", { tweet });
}));

// ------Create reply route--------//
router.post("/:id", isLoggedIn, upload.array("image"), validateTweet, catchAsync(async (req, res, next) => {
    const tweet = await Tweet.findById(req.params.id).populate("replies");
    const replyTweet = new Tweet(req.body.tweet);
    replyTweet.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    replyTweet.author = req.user._id;
    await replyTweet.save();
    await tweet.replies.push(replyTweet);
    await tweet.save();
    req.flash("success", "Successfully created a new post");
    res.redirect(`/tweets/${tweet._id}`)
}));

// ------Delete reply route ----

router.delete("/:id/replyId", isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const { id, replyId } = req.params;
    await Tweet.findByIdAndUpdate(id, { $pull: { replies: replyId } });
    await Tweet.findByIdAndDelete( replyId );
    req.flash("success", "You deleted your tweet");
    res.redirect(`/tweets/${id}`)
}));


// DELETE ROUTE
router.delete("/:id",isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    await Tweet.findByIdAndDelete(req.params.id);
    req.flash("success", "Successfully deleted your post");
    res.redirect("/tweets")
}));


module.exports = router;