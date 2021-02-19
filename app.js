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
const MongoStore = require('connect-mongo')(session);
const ExpressError = require("./utils/ExpressError");
const tweetRoutes = require("./routes/tweets");
const userRoutes = require("./routes/users");
const timeLineRoute = require("./routes/timeline");
const User = require("./models/user");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const { countButton } = require("./public/js/utils");
const { isLoggedOut } = require("./middleware");
const { func } = require("joi");
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/twitter";
const secret = process.env.SECRET || "thisshouldbeabettersecret"

mongoose.connect(dbUrl, {
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

const store = new MongoStore({
    url: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
})

// Session config
const sessionConfig = {
    store,
    name: "session",
    secret,
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
app.use(passport.initialize()); 
app.use(passport.session()); 
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// flash and middleware
app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    res.locals.countButton = countButton;
    next();
});

// Landing page Route
app.get("/", isLoggedOut, (req, res) => {
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

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Serving on port ${port}`);
});

