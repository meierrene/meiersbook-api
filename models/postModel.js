const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String },
    image: { type: String, required: [true, 'Please provide a image.'] },
    createdAt: { type: Date, default: Date.now },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    creator: { type: mongoose.Types.ObjectId, ref: 'User' },
    modified: { type: Boolean, default: false },
  },
  { toJSON: { virtuals: true } },
  { toObject: { virtuals: true } }
);

// Middleware to automatically set the `modified` field to true if the post is edited
postSchema.pre('save', function (next) {
  // Check if any field other than 'likes' is modified
  if (this.isModified('title') || this.isModified('image')) {
    this.modified = true;
  }
  next();
});

postSchema.pre(/^find/, function (next) {
  this.select('-__v');
  next();
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
