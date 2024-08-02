require('dotenv').config({ path: './config.env' });
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid'); // Import UUID package

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define the storage function to return a CloudinaryStorage instance
const storage = (folder, type, format) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      resource_type: type,
      format: async (req, file) => format,
      public_id: (req, file) => {
        // Generate a unique public_id
        const uniqueId = uuidv4();
        const fileNameWithoutExtension = file.originalname.split('.')[0];
        return `${fileNameWithoutExtension}-${uniqueId}`;
      },
      type: 'authenticated', // Ensure the video is uploaded as authenticated
    },
  });
};

// Define the upload function to return a multer instance with the specified storage
const upload = (folder, type, format) => {
  return multer({ storage: storage(folder, type, format) });
};

module.exports = upload;