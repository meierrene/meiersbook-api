const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String },
    image: { type: String, required: [true, 'Please provide a image.'] },
    createdAt: { type: Date, default: Date.now },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    creator: { type: mongoose.Types.ObjectId, ref: 'User' },
    modified: { type: Boolean, default: false },
    comments: [
      {
        text: String,
        edited: {
          type: Boolean,
          default: false,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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
