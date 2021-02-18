const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// cloudinary credentials config 
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

// Create a new storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "Twitter",
        alloweFormats: ["jpeg", "png", "jpg"]
    }
});

module.exports = { cloudinary, storage }