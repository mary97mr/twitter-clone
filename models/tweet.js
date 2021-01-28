const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tweetSchema = new Schema({
    images: [{ // Modify images for an array of pictures.
        url: String,
        filename : String
    }],
    text: String,
    date: { type: Date, default: Date.now },
    author: { type: Schema.Types.ObjectId, ref: "User" },
    parent: { type: Schema.Types.ObjectId, ref: "Tweet", default:null },
    replies: [{ type: Schema.Types.ObjectId, ref: "Tweet" }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }]
});

// Fix it, not working
// tweetSchema.post("findOneAndDelete", async function(doc) {
//     if(doc) {
//         await this.deleteMany({
//             _id: { $in : doc.replies }
//         });
//     }
// });

module.exports = mongoose.model("Tweet", tweetSchema);