// ============================================================
// models/Post.model.js
// ============================================================

import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title must be at most 150 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    coverImage: {
      type: String,
      default: '', // Cloudinary URL
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    readTime: {
      type: Number, // in minutes
      default: 1,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---- Indexes ----
postSchema.index({ title: 'text', content: 'text', tags: 'text' });
postSchema.index({ author: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });

// ---- Virtuals ----
postSchema.virtual('likeCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

postSchema.virtual('bookmarkCount').get(function () {
  return this.bookmarks ? this.bookmarks.length : 0;
});

// ---- Pre-save: Calculate read time from content word count ----
// Average reading speed: 200 words per minute
postSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    const wordCount = this.content.trim().split(/\s+/).length;
    this.readTime = Math.max(1, Math.ceil(wordCount / 200));
  }
  next();
});

const Post = mongoose.model('Post', postSchema);

export default Post;
