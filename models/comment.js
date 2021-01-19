const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const commentSchema = new Schema({
    body: String,
    likes: { type: Number, default: 0 },
    createdAt: { type: Date },
    author: { type: Schema.Types.ObjectId, ref: "User"}
});

module.exports = mongoose.model("Comment", commentSchema);