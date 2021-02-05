const express = require("express");
const router = express.Router({ mergeParams: true});
const catchAsync = require("../utils/catchAsync");
const Tweet = require("../models/tweet");
const User = require("../models/user");
const { isLoggedIn, validateTweet, isReplyAuthor } = require("../middleware");

//Multer is a middleware that divides our req.body and req.files => [{info pic1},{info pic2},{}...]
const multer = require("multer"); 
const { storage } = require("../cloudinary");
const upload = multer({ storage }); // Now pics will be save in our storage.

// ------Create reply route--------//
router.post("/", isLoggedIn, upload.array("image"), validateTweet, catchAsync(async (req, res, next) => {
    const tweet = await Tweet.findById(req.params.id).populate("replies");
    const currentUser = await User.findById(req.user._id);
    // create and save reply
    const replyTweet = new Tweet(req.body.tweet);
    replyTweet.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    replyTweet.author = currentUser._id;
    replyTweet.parent = tweet;
    await replyTweet.save();
    // push reply into replies and save
    await tweet.replies.push(replyTweet);
    await tweet.save();
    // push replyTweet into user tweets and save
    await currentUser.tweets.unshift(replyTweet);
    await currentUser.save();
    // redirect
    req.flash("success", "Successfully created a new post");
    res.redirect(`/tweets/${tweet._id}`)
}));

module.exports = router;