// const fs = require('fs');
const path = require('path');

// Define paths
const pathPostImage = path.join('post');
const pathUserImage = path.join('user');
const newImage = 'newImage.jpeg';
const thumbnailSettings = { size: 300, quality: 80 };
// const pathPostImage = path.join(__dirname, '..', 'uploads/postsImages/');
// const pathUserImage = path.join(__dirname, '..', 'uploads/userImages/');
// Ensure directories exist or create them
// [pathPostImage, pathUserImage].forEach(dir => {
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//   }
// });

// Export paths
module.exports = {
  pathPostImage,
  pathUserImage,
  newImage,
  thumbnailSettings,
};
