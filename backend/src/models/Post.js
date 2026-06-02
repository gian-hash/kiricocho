const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['news', 'photo', 'announcement', 'result'],
      default: 'news',
    },
    title: { type: String, default: '' },
    content: { type: String, required: true },
    image: { type: String, default: null }, // path immagine
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    pinned: { type: Boolean, default: false }, // solo admin può pinnare
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
