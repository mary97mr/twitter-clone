const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const tweetSchema = new Schema({
    image: String,
    description: String,
    location: String,
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }]
});

module.exports = mongoose.model("Tweet", tweetSchema);