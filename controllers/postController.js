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

exports.comment = catcher(async (req, res, next) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id.toString();

    const post = await Post.findById(postId).populate('creator');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Add the comment
    post.comments.push({ text, user: userId });
    await post.save();

    res.status(201).json({ message: 'Comment added successfully', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

exports.editComment = catcher(async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id.toString();

    const post = await Post.findById(id).populate('comments.user');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Find the specific comment by ID within the comments array
    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the user is the owner of the comment
    if (comment.user._id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to update this comment' });
    }

    // Update the comment text
    comment.text = text;
    comment.edited = true;
    await post.save();

    res.status(200).json({ message: 'Comment updated successfully', comment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

exports.removeComment = catcher(async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user._id.toString();

    const post = await Post.findById(id).populate('creator comments.user');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    // Find the comment to delete
    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the user is the post creator or the comment creator
    if (
      post.creator._id.toString() !== userId.toString() &&
      comment.user._id.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this comment' });
    }

    // Remove the comment
    comment.deleteOne();
    await post.save();

    res.status(200).json({ message: 'Comment deleted successfully', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

exports.getAllPosts = operators.getAll(Post);
exports.getPost = operators.getOne(Post, 'creator likes comments.user');
exports.createPost = operators.createOne(Post, User);
exports.updatePost = operators.updateOne(Post);
exports.deletePost = operators.deleteOne(Post, User);
exports.deleteEverything = operators.deleteAll(Post);
