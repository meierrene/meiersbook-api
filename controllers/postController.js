const Post = require('../models/postModel');
const User = require('../models/userModel');
const operators = require('./operators');
const catcher = require('../utils/catcher');
const multer = require('multer');
const sharp = require('sharp');
const ErrorThrower = require('../utils/ErrorThrower');
const options = require('../utils/options');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new ErrorThrower('Please upload only images.', 400), false);
};

const upload = multer({ storage, fileFilter });

exports.uploadImage = upload.single('image');

exports.resizeImage = catcher(async (req, res, next) => {
  if (!req.file) return next();
  req.body.image = req.params.id
    ? `image-${req.params.id}.jpeg`
    : options.newImage;
  await sharp(req.file.buffer, { failOnError: false })
    .toFormat('jpeg')
    .jpeg({ quality: 100 })
    .toFile(`${options.pathPostImage}/${req.body.image}`);
  next();
});

exports.getAllPosts = operators.getAll(Post);
exports.getPost = operators.getOne(Post);
exports.createPost = operators.createOne(
  Post,
  options.pathPostImage,
  options.newImage,
  User
);
exports.updatePost = operators.updateOne(Post);
exports.deletePost = operators.deleteOne(Post, options.pathPostImage, User);
exports.deleteEverything = operators.deleteAll(Post, options.pathPostImage);
