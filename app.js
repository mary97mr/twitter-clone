// Dotenv Config
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const flash = require("connect-flash");
const session = require("express-session");
const ExpressError = require("./utils/ExpressError");
const tweetRoutes = require("./routes/tweets");
const userRoutes = require("./routes/users");
const timeLineRoute = require("./routes/timeline");
const User = require("./models/user");
const passport = require("passport");
const LocalStrategy = require("passport-local");

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

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.locals.moment = require("moment");

// Session config
const sessionConfig = {
    secret: "thisshouldbeabettersecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));

// Passport Config
app.use(passport.initialize());  // middleware is required to initialize Passport
app.use(passport.session());  // If your application uses persistent login sessions
passport.use(new LocalStrategy(User.authenticate())); // use static authenticate method of model in LocalStrategy
passport.serializeUser(User.serializeUser()); // use static serialize and deserialize of model for passport session support
passport.deserializeUser(User.deserializeUser());

// flash and middleware
app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});

// Home page Route
app.get("/", (req, res) => {
    res.render("home");
});

// Using the routes
app.use("/tweets", tweetRoutes);
app.use("/", userRoutes);
app.use("/", timeLineRoute);

// Basic error handling
app.all("*", (req, res, next) => {
    next(new ExpressError("Page not found", 404))
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Something went wrong"
    res.status(statusCode).render("error", { err });
});

// Listen Route
app.listen(3000, () => {
    console.log("twitter running on port 3000");
});

