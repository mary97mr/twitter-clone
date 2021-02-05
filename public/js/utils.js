const Tweet = require("../../models/tweet")
const User = require("../../models/user")
const { cloudinary } = require("../../cloudinary");

async function deleteTweet(tweetId) {
    try {
        const tweet = await Tweet.findById(tweetId).populate("parent retweets")
        // If tweet type reply
        if (tweet.parent) {
            const parentId = tweet.parent._id;
            const parentTweet = await Tweet.findByIdAndUpdate(parentId, { $pull: { replies: tweetId } });
            await parentTweet.save();
        }
        const user = await User.findByIdAndUpdate(tweet.author._id, { $pull: { tweets: tweetId } })
        await user.save();
        for (let retweet of tweet.retweets) {
            const userRetweet = await User.findByIdAndUpdate(retweet.author._id, { $pull: { tweets: retweet._id } });
            await userRetweet.save();
        }
        for (let image of tweet.images) {
            cloudinary.uploader.destroy(image);
        }
        for (let reply of tweet.replies) {
            deleteTweet(reply._id)
        }
        await Tweet.findByIdAndDelete(tweetId);
        // // Deleting also replies inside a post
        await Tweet.deleteMany({
            _id: { $in: tweet.retweets }
        });
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/twitter/home");
    }
}

module.exports = { deleteTweet }