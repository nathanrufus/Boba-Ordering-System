const cloudinary = require("../config/cloudinary");

function uploadBufferToCloudinary(buffer, folder = "boba-items") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

module.exports = { uploadBufferToCloudinary };