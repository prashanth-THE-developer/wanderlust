const Joi = require("joi");

// Rules for the create/edit listing form. Any field not listed here is rejected,
// so nobody can sneak in extra fields like "owner" or "geometry".
module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().trim().max(100).required(),
    description: Joi.string().trim().max(2000).required(),
    country: Joi.string().trim().max(60).required(),
    location: Joi.string().trim().max(100).required(),
    price: Joi.number().min(0).max(10000000).required(),
  }).required(),
});

// Rules for the review form (rating 1-5 + comment)
module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().trim().max(1000).required(),
  }).required(),
});
