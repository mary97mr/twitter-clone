const express = require("express");
const router = express.Router({ mergeParams: true });
const Comment = require("../models/comment");
const Tweet = require("../models/tweet");
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn, validateComment } = require("../middleware");


// ------- Comments Routes------//
// Create Comment Route 
router.post("/", validateComment,isLoggedIn, catchAsync(async (req, res) => {
    const tweet = await Tweet.findById(req.params.id);
    const newComment = new Comment(req.body.comment);
    tweet.comments.push(newComment);
    await newComment.save();
    await tweet.save();
    req.flash("success", "Created new comment");
    res.redirect(`/tweets/${tweet._id}`)
}));

// Update Comment Route 
router.put("/:comment_id",validateComment, isLoggedIn, catchAsync(async (req, res) => {
    await Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment);
    req.flash("success", "Updated your comment");
    res.redirect(`/tweets/${req.params.id}`);
}));

// Delete Comment Route 
router.delete("/:comment_id", isLoggedIn, catchAsync(async (req, res) => {
    const { id, comment_id } = req.params;
    await Tweet.findByIdAndUpdate(id, { $pull: { comments: comment_id } });
    await Comment.findByIdAndDelete(comment_id);
    req.flash("success", "You deleted your comment");
    res.redirect(`/tweets/${id}`)
}));

module.exports = router;