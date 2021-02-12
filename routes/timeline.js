const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn } = require("../middleware");
const User = require("../models/user");

// Route that displays tweets of current user and also the one of their following
router.get("/twitter/home", isLoggedIn, catchAsync(async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: "timeline",
        populate: {
            path: "author parent retweetStatus retweets",
            populate: {
                path: "author parent retweets",
                populate: { path: "author" }
            }
        }
    });
    const timeline = user.timeline;
    timeline.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date)
    });
    res.render("timeline", { tweets: timeline });
}));

module.exports = router;