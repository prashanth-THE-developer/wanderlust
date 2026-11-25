const mongoose = require("mongoose");
const Listing = require("../models/listing");
require("../models/user");   // registers User model so populate("owner") works
const ExpressError = require("../utils/ExpressError");
const geocode = require("../utils/geocode");
const { deleteImage } = require("../cloudConfig");

const LOCATION_ERROR = "We couldn't find that location. Please check the location and country.";

// Ask Mapbox where "location, country" is. Returns a map point, or null if not found.
async function findGeometry({ location, country }) {
  try {
    return await geocode(`${location}, ${country}`);
  } catch (err) {
    console.error("Mapbox geocoding failed:", err.message);
    return null;
  }
}

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;

  // A wrong id like /listings/abc should give 404, not crash
  if (!mongoose.isValidObjectId(id)) {
    throw new ExpressError(404, "Listing not found!");
  }

  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  if (!listing) {
    throw new ExpressError(404, "Listing not found!");
  }

  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
  if (!req.file) {
    req.flash("error", "Please choose an image for your listing.");
    return res.redirect("/listings/new");
  }

  const geometry = await findGeometry(req.body.listing);
  if (!geometry) {
    await deleteImage(req.file.filename);
    req.flash("error", LOCATION_ERROR);
    return res.redirect("/listings/new");
  }

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.geometry = geometry;
  newListing.image = { url: req.file.path, filename: req.file.filename };

  try {
    await newListing.save();
  } catch (err) {
    await deleteImage(req.file.filename);   // don't leave an unused image in Cloudinary
    throw err;
  }

  req.flash("success", "New listing created!");
  res.redirect(`/listings/${newListing._id}`);
};

module.exports.renderEditForm = async (req, res) => {
  const listing = req.listing;               // loaded by isOwner
  const imageUrl = listing.image && listing.image.url;

  // Cloudinary can resize on the fly; sample-data (Unsplash) links are used as they are
  const thumbUrl =
    imageUrl && imageUrl.includes("/upload/")
      ? imageUrl.replace("/upload/", "/upload/h_300,w_250/")
      : imageUrl;

  res.render("listings/edit.ejs", { listing, thumbUrl });
};

module.exports.updateListing = async (req, res) => {
  const listing = req.listing;               // loaded by isOwner
  const data = req.body.listing;

  // Look up the map point again only when the place changed
  const placeChanged = data.location !== listing.location || data.country !== listing.country;
  let newGeometry = null;

  if (placeChanged) {
    newGeometry = await findGeometry(data);
    if (!newGeometry) {
      if (req.file) await deleteImage(req.file.filename);
      req.flash("error", LOCATION_ERROR);
      return res.redirect(`/listings/${listing._id}/edit`);
    }
  }

  const oldFilename = listing.image && listing.image.filename;

  listing.set(data);
  if (newGeometry) listing.geometry = newGeometry;
  if (req.file) listing.image = { url: req.file.path, filename: req.file.filename };

  try {
    await listing.save();
  } catch (err) {
    if (req.file) await deleteImage(req.file.filename);
    throw err;
  }

  if (req.file) await deleteImage(oldFilename);   // remove the old image only after saving worked

  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyListing = async (req, res) => {
  // findByIdAndDelete also deletes the listing's reviews (see models/listing.js)
  const deleted = await Listing.findByIdAndDelete(req.listing._id);
  if (deleted) await deleteImage(deleted.image && deleted.image.filename);

  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
};
