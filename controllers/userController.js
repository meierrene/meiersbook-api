const User = require('../models/userModel');
const Post = require('../models/postModel');
const operators = require('./operators');
const catcher = require('../utils/catcher');
const multer = require('multer');
const sharp = require('sharp');
const ErrorThrower = require('../utils/ErrorThrower');
const options = require('../utils/options');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new ErrorThrower('Please upload only images.', 400));
};

const upload = multer({ storage, fileFilter });

exports.uploadUserPhoto = upload.single('image');

exports.resizeUserPhoto = catcher(async (req, res, next) => {
  if (!req.file) return next();

  // priorities: req.params.id --> req.user.image --> options.newImage

  req.body.image = req.params.id
    ? `image-${req.params.id}.jpeg`
    : req.user?.image
    ? req.user.image
    : options.newImage;
  await sharp(req.file.buffer, { failOnError: false })
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 80 })
    .toFile(`${options.pathUserImage}/${req.body.image}`);
  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catcher(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new ErrorThrower(
        'This route is not for password updates. Please use /updateMyPassword ',
        400
      )
    );

  // 2) Filter out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.image = req.file.filename;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { users: updatedUser },
  });
});
// Do NOT update Passwords with this!

exports.beforeDeleteUser = catcher(async (req, res, next) => {
  req.removeThisId = req.params.id || req.user.id;
  next();
});

// Creating user before signing up to generate a new token
exports.createUser = operators.createOne(
  User,
  options.pathUserImage,
  options.newImage
);
exports.getAllUsers = operators.getAll(User);
exports.getUser = operators.getOne(User, 'posts');
exports.updateUser = operators.updateOne(User);
exports.deleteMyFiles = operators.deleteAll(Post, options.pathPostImage);
exports.deleteUser = operators.deleteOne(User, options.pathUserImage);
