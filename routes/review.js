const express = require("express");
// mergeParams lets this router read :id from the "/listings/:id/reviews" part of the URL
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, validateReview, isReviewAuthor } = require("../middleware");
const reviewController = require("../controllers/reviews");

router.post("/", isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

router.delete(
  "/:reviewId",
  isLoggedIn,
  wrapAsync(isReviewAuthor),
  wrapAsync(reviewController.destroyReview)
);

module.exports = router;
