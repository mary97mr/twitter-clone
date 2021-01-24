const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }]
});

userSchema.plugin(passportLocalMongoose);

// Passport-Local Mongoose will add a username, hash and salt field. Also adds some methods to your Schema.

module.exports = mongoose.model("User", userSchema)