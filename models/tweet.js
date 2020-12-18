const { func } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Comment = require("./comment")

const tweetSchema = new Schema({
    image: String,
    description: String,
    location: String,
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }]
});

tweetSchema.post("findOneAndDelete", async function(doc) {
    if(doc) {
        await Comment.deleteMany({
            _id: { $in : doc.comments }
        });
    }
});

module.exports = mongoose.model("Tweet", tweetSchema);