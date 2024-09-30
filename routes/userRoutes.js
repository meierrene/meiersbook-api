const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const operators = require('../controllers/operators');
const options = require('../utils/options');

const router = express.Router();

router
  .route('/find/:id')
  .get(userController.getUserNamebyId, userController.getUser);

router.post(
  '/signup',
  operators.uploadImage,
  operators.resizeImage(options.pathUserImage, false, 500, 500, 80),
  userController.createUser,
  authController.signup
);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middlware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  operators.uploadImage,
  operators.resizeImage(options.pathUserImage, true, 500, 500, 80),
  userController.updateMe
);
router.delete(
  '/deleteMe',
  userController.beforeDeleteUser,
  userController.deleteMyFiles,
  userController.deleteUser
);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  // .get(userController.getUser)
  .patch(
    operators.uploadImage,
    operators.resizeImage(options.pathUserImage, true, 500, 500, 80),
    userController.updateUser
  )
  .delete(
    userController.beforeDeleteUser,
    userController.deleteMyFiles,
    userController.deleteUser
  );

module.exports = router;
