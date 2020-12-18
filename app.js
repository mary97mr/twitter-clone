const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const Joi = require("joi");
const { tweetSchema, commentSchema } = require("./schemas");
const Tweet = require("./models/tweet");
const Comment = require("./models/comment");
const ExpressError = require("./utils/ExpressError");
const catchAsync = require("./utils/catchAsync");
const { join } = require("path");

mongoose.connect("mongodb://localhost:27017/twitter", {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})
    .then(() => console.log("CONNECTED TO DB"))
    .catch(e => console.log(e.message));

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.locals.moment = require("moment");

// Joi validation middleware
const validateTweet = (req, res, next) => {
    const { error } = tweetSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(",")
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

const validateComment = (req, res, next) => {
    const { error } = commentSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(",")
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

// ------- Tweets Routes------//
app.get("/", (req, res) => {
    res.render("home");
});

// INDEX ROUTE
app.get("/tweets", async (req, res) => {
    const allTweets = await Tweet.find({});
    res.render("tweets/index", { tweets: allTweets });
});

// NEW ROUTE
app.get("/tweets/new", (req, res) => {
    res.render("tweets/new");
});

// CREATE ROUTE
app.post("/tweets", validateTweet, catchAsync(async (req, res, next) => {
    const tweetCreated = new Tweet(req.body.tweet);
    await tweetCreated.save();
    res.redirect(`/tweets/${tweetCreated._id}`)
}));

// SHOW ROUTE
app.get("/tweets/:id", catchAsync(async (req, res) => {
    const tweet = await Tweet.findById(req.params.id).populate("comments");
    res.render("tweets/show", { tweet });
}));

// EDIT ROUTE
app.get("/tweets/:id/edit", catchAsync(async (req, res) => {
    const tweet = await Tweet.findById(req.params.id);
    res.render("tweets/edit", { tweet });
}));

// UPDATE ROUTE
app.put("/tweets/:id", validateTweet, catchAsync(async (req, res) => {
    const updatedTweet = await Tweet.findByIdAndUpdate(req.params.id, req.body.tweet)
    res.redirect(`/tweets/${updatedTweet._id}`)
}));

// DELETE ROUTE
app.delete("/tweets/:id", catchAsync(async (req, res) => {
    await Tweet.findByIdAndDelete(req.params.id)
    res.redirect("/tweets")
}));

// ------- Comments Routes------//

// Create Comment Route 
app.post("/tweets/:id/comments", validateComment, catchAsync(async (req, res) => {
    const tweet = await Tweet.findById(req.params.id);
    const newComment = new Comment(req.body.comment);
    tweet.comments.push(newComment);
    await newComment.save();
    await tweet.save();
    res.redirect(`/tweets/${tweet._id}`)
}));

// Update Comment Route 
app.put("/tweets/:id/comments/:comment_id",validateComment, catchAsync(async (req, res) => {
    await Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment);
    res.redirect(`/tweets/${req.params.id}`);
}));

// Delete Comment Route 
app.delete("/tweets/:id/comments/:comment_id", catchAsync(async (req, res) => {
    const { id, comment_id } = req.params;
    await Tweet.findByIdAndUpdate(id, { $pull: { comments: comment_id } });
    await Comment.findByIdAndDelete(comment_id)
    res.redirect(`/tweets/${id}`)
}));

// Basic error handling
app.all("*", (req, res, next) => {
    next(new ExpressError("Page not found", 404))
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Something went wrong"
    res.status(statusCode).render("error", { err });
});

// LISTEN ROUTE
app.listen(3000, () => {
    console.log("twitter running on port 3000");
});

