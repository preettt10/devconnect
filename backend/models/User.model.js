// ============================================================
// models/User.model.js
// ============================================================

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '../constants.js';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
      match: [/^[a-z0-9_]+$/, 'Username may only contain lowercase letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never returned by default in queries
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name must be at most 60 characters'],
    },
    bio: {
      type: String,
      default: '',
      maxlength: [300, 'Bio must be at most 300 characters'],
    },
    avatar: {
      type: String,
      default: '', // Cloudinary URL
    },
    skills: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    githubUrl: {
      type: String,
      default: '',
      match: [/^$|^(https?:\/\/)?(www\.)?github\.com\/.+/, 'Please enter a valid GitHub URL'],
    },
    portfolioUrl: {
      type: String,
      default: '',
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    refreshToken: {
      type: String,
      default: '',
      select: false, // Never returned by default
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
    },
  },
  {
    timestamps: true,         // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---- Indexes ----
// Note: email and username unique indexes are auto-created by unique:true above.
// Only define the text search index here (not declared in schema fields).
userSchema.index({ name: 'text', username: 'text', skills: 'text' });

// ---- Virtuals ----
userSchema.virtual('followerCount').get(function () {
  return this.followers ? this.followers.length : 0;
});

userSchema.virtual('followingCount').get(function () {
  return this.following ? this.following.length : 0;
});

// postCount is populated dynamically from the Post model — not stored here
// to avoid consistency issues.

// ---- Pre-save hook: Hash password only when modified ----
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
    next();
  } catch (err) {
    next(err);
  }
});

// ---- Instance method: Compare plain-text password with hash ----
userSchema.methods.comparePassword = async function (plainText) {
  return bcrypt.compare(plainText, this.password);
};

// ---- Instance method: Return safe public profile (no secrets) ----
userSchema.methods.toPublicProfile = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
