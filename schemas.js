const Joi = require("joi");
module.exports.tweetSchema = Joi.object({
    tweet: Joi.object({
        text: Joi.string().required(),
    }).required()
});
