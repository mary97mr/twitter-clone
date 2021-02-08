const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn } = require("../middleware");
const User = require("../models/user");

// Route that displays tweets of current user and also the one of their following
router.get("/twitter/home", isLoggedIn, catchAsync(async (req, res) => {
    const user = await User.findById(req.user._id);
    const timeline = [];
    addTweetTimeline(user.tweets, timeline);
    for (let following of user.following) {
        addTweetTimeline(following.tweets, timeline);
    }
    timeline.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date)
    });
    console.log(timeline)
    res.render("timeline", { timeline });
}));

const addTweetTimeline = (arr, timeline) => {
    for (tweet of arr) {
        const tweetFound = timeline.some(item => {
            return item._id.equals(tweet._id)
        });
        if (!tweetFound) {
            timeline.push(tweet);
        } else {
            timeline.pull(tweet._id)
        }
    }
}

module.exports = router;