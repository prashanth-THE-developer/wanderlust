const express = require("express");
const multer = require("multer");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");
const { isLoggedIn, isOwner, validateListing } = require("../middleware");
const { storage } = require("../cloudConfig");
const listingController = require("../controllers/listings");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },   // 5 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new ExpressError(400, "Only JPG, PNG or WEBP images are allowed."));
  },
});

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,                              // check login BEFORE uploading anything
    upload.single("listing[image]"),
    wrapAsync(validateListing),
    wrapAsync(listingController.createListing)
  );

// must come before "/:id", otherwise "new" would be treated as an id
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    wrapAsync(isOwner),                      // check ownership BEFORE uploading anything
    upload.single("listing[image]"),
    wrapAsync(validateListing),
    wrapAsync(listingController.updateListing)
  )
  .delete(isLoggedIn, wrapAsync(isOwner), wrapAsync(listingController.destroyListing));

router.get("/:id/edit", isLoggedIn, wrapAsync(isOwner), wrapAsync(listingController.renderEditForm));

module.exports = router;
