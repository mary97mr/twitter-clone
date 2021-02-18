const Tweet = require("./models/tweet");
const User = require("./models/user");
const { tweetSchema } = require("./schemas");
const ExpressError = require("./utils/ExpressError");

// To protect some routes we create a middleware to know if user is logged in or not. To prove this we use a method from passport isAuthenticated() that is located in req.
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You need to login first.")
        return res.redirect("/login"); //we return the redirect in order doesnt run next().
    }
    next();
}

module.exports.isLoggedOut = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect("/twitter/home"); //we return the redirect in order doesnt run next().
    }
    next();
}

module.exports.isAuthor = async (req, res, next) => {
    //We need to find the post first 
    const tweet = await Tweet.findById(req.params.id);
    // Compare if the author and the user loggin is the same
    if (!tweet.author._id.equals(req.user._id)) {
        req.flash("error", "You dont have permission to do that.")
        return res.redirect("back");
    }
    next();
}

module.exports.isUserProfile = async (req, res, next) => {
    //We need to find the user first 
    const user = await User.findOne({ username: req.params.username });
    // Compare if the user id and the user loggin is the same
    if (!user._id.equals(req.user._id)) {
        req.flash("error", "You dont have permission to do that.")
        return res.redirect("back");
    }
    next();
}

module.exports.searching = async (req, res, next) => {
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi')
        const userSearch = await User.findOne({ username: regex }).populate({
            path: "tweets followers following",
            populate: {
                path: "author parent retweetStatus retweets",
                populate: {
                    path: "author parent retweets",
                    populate: { path: "author" }
                }
            }
        });
        if (!userSearch) {
            req.flash("error", "Couldnt find user, try again.");
            return res.redirect("/twitter/home");
        }
        return res.render("users/profile", { user: userSearch, tweets: userSearch.tweets });
    }
    next()
}

//  We move validations in middleware file.
// Joi validation middleware
module.exports.validateTweet = (req, res, next) => {
    const { error } = tweetSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(",")
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}