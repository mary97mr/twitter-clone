const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError");
const tweetRoutes = require("./routes/tweets");
const commentRoutes = require("./routes/comments");

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


app.get("/", (req, res) => {
    res.render("home");
});

// Using the routes
app.use("/tweets", tweetRoutes)
app.use("/tweets/:id/comments", commentRoutes)

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

