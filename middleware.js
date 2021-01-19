// To protect some routes we create a middleware to know if user is logged in or not. To prove this we use a method from passport isAuthenticated() that is located in req.
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You need to login first.")
        return res.redirect("/login"); //we return the redirect in order doesnt run next().
    }
    next();
}