const Joi = require("joi");
module.exports.tweetSchema = Joi.object({
    tweet: Joi.object({
        description: Joi.string().required(),
        location: Joi.string().required(),
    }).required()
});
