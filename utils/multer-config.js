require("dotenv").config({ path: "./config.env" });
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const { v4: uuidv4 } = require("uuid"); // Import UUID package

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "videos",
    resource_type: "video",
    format: async (req, file) => "mp4",
    public_id: (req, file) => {
      // Generate a unique public_id
      const uniqueId = uuidv4();
      const fileNameWithoutExtension = file.originalname.split(".")[0];
      return `${fileNameWithoutExtension}-${uniqueId}`;
    },
    type: "authenticated", // Ensure the video is uploaded as authenticated
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
