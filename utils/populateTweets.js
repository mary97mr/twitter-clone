module.exports = (first = "", second = "author", third ="author") => {
    return function(next) {
        this.populate({
            path: "tweets following",
            populate: {
                path: first,
                populate: {
                    path: second,
                    populate: {path: third } 
                }
            }
        });
        next();
    }
}