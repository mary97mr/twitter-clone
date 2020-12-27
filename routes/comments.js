const express = require("express");
const router = express.Router({ mergeParams: true });
const Comment = require("../models/comment");
const Tweet = require("../models/tweet");
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const { commentSchema } = require("../schemas");


// Joi validation middleware
const validateComment = (req, res, next) => {
    const { error } = commentSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(",")
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

// ------- Comments Routes------//
// Create Comment Route 
router.post("/", validateComment, catchAsync(async (req, res) => {
    const tweet = await Tweet.findById(req.params.id);
    const newComment = new Comment(req.body.comment);
    tweet.comments.push(newComment);
    await newComment.save();
    await tweet.save();
    res.redirect(`/tweets/${tweet._id}`)
}));

// Update Comment Route 
router.put("/:comment_id",validateComment, catchAsync(async (req, res) => {
    await Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment);
    res.redirect(`/tweets/${req.params.id}`);
}));

// Delete Comment Route 
router.delete("/:comment_id", catchAsync(async (req, res) => {
    const { id, comment_id } = req.params;
    await Tweet.findByIdAndUpdate(id, { $pull: { comments: comment_id } });
    await Comment.findByIdAndDelete(comment_id)
    res.redirect(`/tweets/${id}`)
}));

module.exports = router;