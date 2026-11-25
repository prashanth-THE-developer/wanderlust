const mongoose = require("mongoose");
const Listing = require("../models/listing");
const Review = require("../models/review");
const ExpressError = require("../utils/ExpressError");

module.exports.createReview = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ExpressError(404, "Listing not found!");
  }
  if (!(await Listing.exists({ _id: id }))) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  const review = await Review.create({ ...req.body.review, author: req.user._id });

  try {
    // $push changes only the reviews list (the rest of the listing is not re-validated)
    await Listing.updateOne({ _id: id }, { $push: { reviews: review._id } });
  } catch (err) {
    await Review.findByIdAndDelete(review._id);   // don't leave a review that no listing points to
    throw err;
  }

  req.flash("success", "New review created!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyReview = async (req, res) => {
  const { id, reviewId } = req.params;

  await Listing.updateOne({ _id: id }, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  req.flash("success", "Review deleted!");
  res.redirect(`/listings/${id}`);
};
