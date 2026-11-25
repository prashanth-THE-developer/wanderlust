require("dotenv").config({ quiet: true });
const crypto = require("crypto");
const mongoose = require("mongoose");
const { data } = require("./data.js");
const Listing = require("../models/listing");
const User = require("../models/user");

// [longitude, latitude] for each sample location (so seeding needs no Mapbox)
const coordinates = {
  "Malibu": [-118.7798, 34.0259],
  "New York City": [-74.006, 40.7128],
  "Aspen": [-106.8175, 39.1911],
  "Florence": [11.2558, 43.7696],
  "Portland": [-122.6784, 45.5152],
  "Cancun": [-86.8515, 21.1619],
  "Lake Tahoe": [-120.0324, 39.0968],
  "Los Angeles": [-118.2437, 34.0522],
  "Verbier": [7.2286, 46.0964],
  "Serengeti National Park": [34.8333, -2.3333],
};

async function seed() {
  if (!process.env.ATLASDB_URL) {
    throw new Error("ATLASDB_URL is missing in .env");
  }

  await mongoose.connect(process.env.ATLASDB_URL);
  console.log("Seeding database:", mongoose.connection.name);

  // Create a demo owner with a random password (shown once below)
  const password = crypto.randomBytes(6).toString("hex");
  await User.deleteOne({ username: "wanderlust-demo" });
  const owner = await User.register(
    new User({ username: "wanderlust-demo", email: "demo@wanderlust.com" }),
    password
  );

  // Replace all listings with fresh sample data
  await Listing.deleteMany({});
  const listings = data.map((item) => ({
    ...item,
    owner: owner._id,
    geometry: { type: "Point", coordinates: coordinates[item.location] },
  }));
  await Listing.insertMany(listings);

  console.log(`Inserted ${listings.length} listings`);
  console.log(`Demo user: wanderlust-demo / ${password}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});