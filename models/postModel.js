const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
  text: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to
  createdAt: { type: Date, default: Date.now },
  edited: { type: Boolean, default: false },
});

const postSchema = new Schema(
  {
    title: String,
    image: { type: String, required: [true, 'Please provide a image.'] },
    thumbnail: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    modified: { type: Boolean, default: false },
    comments: [commentSchema],
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
