const fs = require('fs');
const path = require('path');

// Define paths
const pathPostImage = path.join(__dirname, 'uploads/postsImages/');
const pathUserImage = path.join(__dirname, 'uploads/userImages/');
const newImage = 'newImage.jpeg';

// Ensure directories exist or create them
[pathPostImage, pathUserImage].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Export paths
module.exports = {
  pathPostImage,
  pathUserImage,
  newImage,
};
