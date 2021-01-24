const express = require("express");
const router = express.Router({ mergeParams: true});
const catchAsync = require("../utils/catchAsync");
const Tweet = require("../models/tweet");
const { isLoggedIn, validateTweet, isAuthor } = require("../middleware");

//Multer is a middleware that divides our req.body and req.files => [{info pic1},{info pic2},{}...]
const multer = require("multer"); 
const { storage } = require("../cloudinary");
const upload = multer({ storage }); // Now pics will be save in our storage.


// ------- Reply Routes------//
// ------Create reply route--------//
router.post("/", isLoggedIn, upload.array("image"), validateTweet, catchAsync(async (req, res, next) => {
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

router.delete("/:replyId", isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const { id, replyId } = req.params;
    await Tweet.findByIdAndUpdate(id, { $pull: { replies: replyId } });
    await Tweet.findByIdAndDelete( replyId );
    req.flash("success", "You deleted your tweet");
    res.redirect(`/tweets/${id}`)
}));

module.exports = router;