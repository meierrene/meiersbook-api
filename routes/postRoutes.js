const express = require('express');
const postController = require('../controllers/postController');

const router = express.Router();

// router.route('/delete-everything').delete(postController.deleteEverything);

router
  .route('/')
  .get(postController.getAllPosts)
  .post(
    postController.uploadImage,
    postController.resizeImage,
    postController.createPost
  );

router
  .route('/:id')
  .get(postController.getPost)
  .patch(
    postController.uploadImage,
    postController.resizeImage,
    postController.updatePost
  )
  .delete(postController.deletePost);

module.exports = router;
