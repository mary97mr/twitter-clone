const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn, searching } = require("../middleware");
const User = require("../models/user");

// Route that displays timeline of current
router.get("/twitter/home", isLoggedIn, searching, catchAsync(async (req, res) => {
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