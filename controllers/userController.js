const User = require('../models/userModel');
const Post = require('../models/postModel');
const operators = require('./operators');
const catcher = require('../utils/catcher');
const ErrorThrower = require('../utils/ErrorThrower');
const options = require('../utils/options');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getUserNamebyId = (req, res, next) => {
  req.filtered = ['name', 'image', 'email'];
  next();
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
