const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

// Turns a place name ("Jaipur, India") into a map point { type: "Point", coordinates: [lng, lat] }.
// Returns null when Mapbox finds nothing.
module.exports = async function geocode(query) {
  // created here (not at the top of the file) so a missing token gives a clear error when used
  const client = mbxGeocoding({ accessToken: process.env.MAP_TOKEN });
  const response = await client.forwardGeocode({ query, limit: 1 }).send();
  const feature = response.body.features[0];
  return feature ? feature.geometry : null;
};
