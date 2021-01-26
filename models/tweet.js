const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tweetSchema = new Schema({
    images: [{ // Modify images for an array of pictures.
        url: String,
        filename : String
    }],
    description: String,
    location: String,
    createdAt: { type: Date},
    author: {type: Schema.Types.ObjectId, ref: "User"},
    replies: [{ type: Schema.Types.ObjectId, ref: "Tweet" }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }]
});

tweetSchema.post("findOneAndDelete", async function(doc) {
    if(doc) {
        await this.deleteMany({
            _id: { $in : doc.replies }
        });
    }
});

module.exports = mongoose.model("Tweet", tweetSchema);