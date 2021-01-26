const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const Tweet = require("../models/tweet");
const { isLoggedIn, validateTweet, isAuthor } = require("../middleware");

//Multer is a middleware that divides our req.body and req.files => [{info pic1},{info pic2},{}...]
const multer = require("multer"); 
const { storage, cloudinary } = require("../cloudinary");
const tweet = require("../models/tweet");
const upload = multer({ storage }); // Now pics will be save in our storage.


// ------- Tweets Routes------//

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
    }).populate("author").populate("likes"); //this populate author is from the tweet model
    if(!tweet) {
        req.flash("error", "Cannot find that post");
        return res.redirect("/twitter/home");
    }
    res.render("tweet", { tweet });
}));

// DELETE ROUTE
router.delete("/:id", isAuthor, catchAsync(async (req, res) => {
    const tweet = await Tweet.findByIdAndDelete(req.params.id);
    for (let image of tweet.images) {
        cloudinary.uploader.destroy(image);
    }
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

module.exports = router;