const Tweet = require("../models/tweet");
const express = require("express");
const router = express.Router()



router.get("/twitter/home", async (req, res) => {
    const allTweets = await Tweet.find({}).populate("author");
    res.render("timeline", { tweets: allTweets });
});

module.exports = router;