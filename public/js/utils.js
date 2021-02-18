const Tweet = require("../../models/tweet")
const User = require("../../models/user")
const { cloudinary } = require("../../cloudinary");

async function deleteTweet(tweetId) {
    const tweet = await Tweet.findById(tweetId).populate("parent retweets")
    // If tweet type reply
    if (tweet.parent) {
        const parentId = tweet.parent._id;
        const parentTweet = await Tweet.findByIdAndUpdate(parentId, { $pull: { replies: tweetId } });
        await parentTweet.save();
    }

    const user = await User.findById(tweet.author._id).populate("followers")
    await user.tweets.pull(tweetId);
    await user.timeline.pull(tweetId);
    for (let follower of user.followers) {
        follower.timeline.pull(tweetId);
        follower.save();
    }
    await user.save();
    for (let retweet of tweet.retweets) {
        const userRetweet = await User.findByIdAndUpdate(retweet.author._id, { $pull: { tweets: retweet._id } });
        await userRetweet.save();
    }
    for (let image of tweet.images) {
        cloudinary.uploader.destroy(image.filename);
    }
    for (let reply of tweet.replies) {
        deleteTweet(reply._id);
    }
    await Tweet.findByIdAndDelete(tweetId);
    // // Deleting also replies inside a post
    await Tweet.deleteMany({
        _id: { $in: tweet.retweets }
    });

}

const addTimeline = (currentUser, tweet) => {
    currentUser.timeline.unshift(tweet);
    for (let follower of currentUser.followers) {
        follower.timeline.unshift(tweet);
        follower.save();    
    }
}

const countButton = (arr) => {
    return (arr.length) ? arr.length : "";
}

module.exports = { deleteTweet, addTimeline, countButton }