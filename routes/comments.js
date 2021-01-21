const express = require("express");
const router = express.Router({ mergeParams: true });
const Comment = require("../models/comment");
const Tweet = require("../models/tweet");
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn, validateComment, isCommentAuthor } = require("../middleware");


// ------- Comments Routes------//
// Create Comment Route 
router.post("/", validateComment, isLoggedIn, catchAsync(async (req, res) => {
    const tweet = await Tweet.findById(req.params.id);
    const newComment = new Comment(req.body.comment);
    newComment.author = req.user._id; // We associate every comment to user login.
    tweet.comments.push(newComment);
    await newComment.save();
    await tweet.save();
    req.flash("success", "Created new comment");
    res.redirect(`/tweets/${tweet._id}`)
}));

// Delete Comment Route 
router.delete("/:comment_id", isLoggedIn, isCommentAuthor, catchAsync(async (req, res) => {
    const { id, comment_id } = req.params;
    await Tweet.findByIdAndUpdate(id, { $pull: { comments: comment_id } });
    await Comment.findByIdAndDelete(comment_id);
    req.flash("success", "You deleted your comment");
    res.redirect(`/tweets/${id}`)
}));

module.exports = router;