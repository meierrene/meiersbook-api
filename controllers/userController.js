const User = require('../models/userModel');
const Post = require('../models/postModel');
const operators = require('./operators');
const catcher = require('../utils/catcher');
const ErrorThrower = require('../utils/ErrorThrower');

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

  req.params.id = req.user.id;

  next();
});
// Do NOT update Passwords with this!

exports.beforeDeleteUser = catcher(async (req, res, next) => {
  req.removeThisId = req.params.id || req.user.id;
  next();
});

// Creating user before signing up to generate a new token
exports.createUser = operators.createOne(User);
exports.getAllUsers = operators.getAll(User);
exports.getUser = operators.getOne(User, 'posts');
exports.updateUser = operators.updateOne(User);
exports.deleteMyFiles = operators.deleteAll(Post);
exports.deleteUser = operators.deleteOne(User);
