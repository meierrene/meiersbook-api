const Post = require('../models/postModel');
const User = require('../models/userModel');
const operators = require('./operators');
const options = require('../utils/options');
const catcher = require('../utils/catcher');
const ErrorThrower = require('../utils/ErrorThrower');

exports.userCheck = catcher(async (req, res, next) => {
  const user = await Post.findById(req.path.replace('/', '')).select('creator');
  if (user.creator.toString() === req.user.id) next();
  else return next(new ErrorThrower('Not authorized', 401));
});

exports.like = catcher(async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Find the post and check if user has already liked it
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Check if the user is trying to like their own post
    if (post.creator.toString() === userId) {
      return res.status(400).json({ message: 'You cannot like your own post' });
    }

    // Check if user already liked the post
    if (post.likes.includes(userId)) {
      return res
        .status(400)
        .json({ message: 'You have already liked this post' });
    }

    // Add the user's ID to the likes array
    post.likes.push(userId);
    await post.save();

    res.status(200).json({ message: 'Post liked', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

exports.unlike = catcher(async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Find the post
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Check if user has not liked the post
    if (!post.likes.includes(userId)) {
      return res.status(400).json({ message: 'You have not liked this post' });
    }

    // Remove the user's ID from the likes array
    post.likes = post.likes.filter(id => id.toString() !== userId);
    await post.save();

    res.status(200).json({ message: 'Post unliked', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
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
