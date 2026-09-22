// ============================================================
// models/Comment.model.js
// ============================================================

import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post reference is required'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      maxlength: [1000, 'Comment must be at most 1000 characters'],
      trim: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Supports threaded replies (one level deep)
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---- Indexes ----
commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ parentComment: 1 });

// ---- Virtuals ----
commentSchema.virtual('likeCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

// ---- Post-save hook: Increment post's commentsCount ----
commentSchema.post('save', async function (doc) {
  try {
    const Post = mongoose.model('Post');
    await Post.findByIdAndUpdate(doc.post, { $inc: { commentsCount: 1 } });
  } catch (err) {
    console.error('Failed to increment commentsCount:', err.message);
  }
});

// ---- Post-deleteOne hook: Decrement post's commentsCount ----
commentSchema.post('deleteOne', { document: true, query: false }, async function (doc) {
  try {
    const Post = mongoose.model('Post');
    await Post.findByIdAndUpdate(doc.post, { $inc: { commentsCount: -1 } });
  } catch (err) {
    console.error('Failed to decrement commentsCount:', err.message);
  }
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
