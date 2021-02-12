const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    biography: { type: String, maxlength: 160 },
    location: {type: String, maxlength: 30 },
    email: {
        type: String,
        unique: true,
        required: true
    },
    image: {
        url: String,
        filename: String,
    },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tweets: [{ type: Schema.Types.ObjectId, ref: "Tweet"}],
    timeline: [{ type: Schema.Types.ObjectId, ref: "Tweet"}]
});

// Passport-Local Mongoose will add a username, hash and salt field. Also adds some methods to your Schema.
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema)