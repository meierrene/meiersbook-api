const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String },
    image: { type: String, required: [true, 'Please provide a image.'] },
    createdAt: { type: Date, default: Date.now() },
  },
  { toJSON: { virtuals: true } },
  { toObject: { virtuals: true } }
);

postSchema.pre(/^find/, function (next) {
  this.select('-__v');
  next();
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
