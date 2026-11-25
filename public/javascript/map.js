mapboxgl.accessToken = mapToken;

const map = new mapboxgl.Map({
  container: "map",
  center: listing.geometry.coordinates, // [longitude, latitude]
  zoom: 9,
});

// Build the popup with textContent so a title can never inject HTML
const popupContent = document.createElement("div");
const heading = document.createElement("h4");
heading.textContent = listing.title;
const note = document.createElement("p");
note.textContent = "Exact location will be provided after booking";
popupContent.append(heading, note);

new mapboxgl.Marker({ color: "red" })
  .setLngLat(listing.geometry.coordinates)
  .setPopup(new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent))
  .addTo(map);
