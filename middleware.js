const mongoose = require("mongoose");
const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError");
const { listingSchema, reviewSchema } = require("./schema");
const { deleteImage } = require("./cloudConfig");

// Runs before a route. If the visitor is not logged in, send them to /login.
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    // Remember the page so we can come back after login (GET pages only,
    // because a browser cannot "go back" to a POST/PUT/DELETE address)
    if (req.method === "GET") {
      req.session.redirectUrl = req.originalUrl;
    }
    req.flash("error", "You must be logged in to do that!");
    return res.redirect("/login");
  }
  next();
};

// passport clears the session on login, so copy the saved URL to res.locals first
module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

// Only the owner may edit or delete a listing. The listing is kept on req.listing for the route.
module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ExpressError(404, "Listing not found!");
  }

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  if (!listing.owner || !listing.owner.equals(req.user._id)) {
    req.flash("error", "You are not the owner of this listing");
    return res.redirect(`/listings/${id}`);
  }

  req.listing = listing;
  next();
};

// Checks the form data against schema.js and keeps the cleaned values (trimmed, numbers)
module.exports.validateListing = async (req, res, next) => {
  const { error, value } = listingSchema.validate(req.body);
  if (error) {
    // the image was already uploaded by multer, so remove it again
    if (req.file) await deleteImage(req.file.filename);
    const message = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, message);
  }
  req.body = value;
  next();
};

// Checks the review form (rating 1-5, comment) and keeps the cleaned values
module.exports.validateReview = (req, res, next) => {
  const { error, value } = reviewSchema.validate(req.body);
  if (error) {
    const message = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, message);
  }
  req.body = value;
  next();
};

// Only the person who wrote a review may delete it
module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;

  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(reviewId)) {
    throw new ExpressError(404, "Review not found!");
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    req.flash("error", "Review not found!");
    return res.redirect(`/listings/${id}`);
  }

  if (!review.author || !review.author.equals(req.user._id)) {
    req.flash("error", "You are not the author of this review!");
    return res.redirect(`/listings/${id}`);
  }

  next();
};
