const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const FOLDER = "WanderLust";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: FOLDER,
    allowed_formats: ["jpg", "jpeg", "png", "webp"],   // Cloudinary's own option name
  },
});

// Delete an image from Cloudinary. Best effort: a failure is logged, never shown to the user.
// Only images we uploaded (inside the WanderLust folder) are deleted, never sample-data links.
async function deleteImage(filename) {
  if (!filename || !filename.startsWith(`${FOLDER}/`)) return;
  try {
    await cloudinary.uploader.destroy(filename, { invalidate: true });
  } catch (err) {
    console.error("Cloudinary delete failed:", err.message);
  }
}

module.exports = { cloudinary, storage, deleteImage };
