const express = require('express');
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');
const operators = require('../controllers/operators');
const options = require('../utils/options');

const router = express.Router();

router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPost);

// Must be logged in
router.use(authController.protect);

router.delete(
  '/delete-everything',
  authController.restrictTo('admin'),
  postController.deleteEverything
);

router.post(
  '/',
  operators.uploadImage,
  operators.resizeImage(options.pathPostImage),
  postController.createPost
);

router.route('/:id/like').post(postController.like);
router.route('/:id/unlike').post(postController.unlike);

router.route('/:id/comment').post(postController.comment);
router
  .route('/:id/comment/:commentId')
  .patch(postController.editComment)
  .delete(postController.removeComment);

router
  .use(postController.userCheck)
  .route('/:id')
  .patch(
    operators.uploadImage,
    operators.resizeImage(options.pathPostImage),
    postController.updatePost
  )
  .delete(postController.deletePost);

module.exports = router;
