const { string } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const commentSchema = new Schema({
    body: String,
    likes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Comment", commentSchema);