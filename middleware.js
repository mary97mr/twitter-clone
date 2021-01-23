const Tweet = require("./models/tweet");
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

module.exports.isAuthor = async (req, res, next) => {
    //We need to find the post first 
    const tweet = await Tweet.findById(req.params.id);
    // Compare if the author and the user loggin is the same
    if (!tweet.author.equals(req.user._id)) {
        req.flash("error", "You dont have permission to do that.")
        return res.redirect(`/tweets/${tweet._id}`);
    }
    next();
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