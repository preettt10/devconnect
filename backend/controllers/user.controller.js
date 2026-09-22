// ============================================================
// controllers/user.controller.js
// Handles: get profile, update profile, avatar upload,
//          follow/unfollow, followers/following lists, search
// ============================================================

import User from '../models/User.model.js';
import Post from '../models/Post.model.js';
import Notification from '../models/Notification.model.js';
import sendResponse from '../utils/sendResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { cloudinary } from '../config/cloudinary.js';
import { NOTIFICATION_TYPES, PAGINATION_DEFAULTS, UPLOAD_PRESETS } from '../constants.js';
import streamifier from 'streamifier';

// ---- GET /api/v1/users/:username ----
export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username })
    .select('-password -refreshToken')
    .lean();

  if (!user) throw ApiError.notFound('User not found');

  // Get post count
  const postCount = await Post.countDocuments({ author: user._id });

  return sendResponse(res, 200, 'User profile fetched', {
    user: { ...user, postCount },
  });
});

// ---- PUT /api/v1/users/profile ----
export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'bio', 'skills', 'githubUrl', 'portfolioUrl'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  if (!user) throw ApiError.notFound('User not found');

  return sendResponse(res, 200, 'Profile updated successfully', { user });
});

// ---- POST /api/v1/users/avatar ----
// Upload profile picture via Cloudinary stream
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image file provided');

  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: UPLOAD_PRESETS.AVATAR,
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: uploadResult.secure_url },
    { new: true }
  ).select('-password -refreshToken');

  return sendResponse(res, 200, 'Avatar uploaded successfully', {
    avatar: uploadResult.secure_url,
    user,
  });
});

// ---- DELETE /api/v1/users/avatar ----
export const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: '' },
    { new: true }
  ).select('-password -refreshToken');

  if (!user) throw ApiError.notFound('User not found');

  return sendResponse(res, 200, 'Avatar removed successfully', { user });
});

// ---- POST /api/v1/users/:id/follow ----
export const toggleFollow = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const currentUserId = req.user._id;

  if (targetId === currentUserId.toString()) {
    throw ApiError.badRequest('You cannot follow yourself');
  }

  const targetUser = await User.findById(targetId);
  if (!targetUser) throw ApiError.notFound('User not found');

  const isFollowing = targetUser.followers.some(
    (id) => id.toString() === currentUserId.toString()
  );

  if (isFollowing) {
    // Unfollow
    await Promise.all([
      User.findByIdAndUpdate(targetId, { $pull: { followers: currentUserId } }),
      User.findByIdAndUpdate(currentUserId, { $pull: { following: targetId } }),
    ]);

    return sendResponse(res, 200, 'Unfollowed successfully', { following: false });
  } else {
    // Follow
    await Promise.all([
      User.findByIdAndUpdate(targetId, { $addToSet: { followers: currentUserId } }),
      User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetId } }),
    ]);

    // Create follow notification (avoid self-notification)
    await Notification.create({
      recipient: targetId,
      sender: currentUserId,
      type: NOTIFICATION_TYPES.FOLLOW,
    });

    // Emit real-time notification via Socket.io (if available)
    const io = req.app.get('io');
    if (io) {
      const sender = await User.findById(currentUserId).select('username name avatar').lean();
      io.to(targetId.toString()).emit('notification:new', {
        type: NOTIFICATION_TYPES.FOLLOW,
        sender,
        message: `${sender.name} started following you`,
      });
    }

    return sendResponse(res, 200, 'Followed successfully', { following: true });
  }
});

// ---- GET /api/v1/users/:id/followers ----
export const getFollowers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || PAGINATION_DEFAULTS.PAGE;
  const limit = parseInt(req.query.limit) || PAGINATION_DEFAULTS.LIMIT;
  const skip = (page - 1) * limit;

  const user = await User.findById(id)
    .select('followers')
    .populate({
      path: 'followers',
      select: 'username name avatar bio skills isOnline',
      options: { skip, limit },
    })
    .lean();

  if (!user) throw ApiError.notFound('User not found');

  const total = user.followers.length;

  return sendResponse(res, 200, 'Followers fetched', {
    followers: user.followers,
    pagination: buildPagination(total, page, limit),
  });
});

// ---- GET /api/v1/users/:id/following ----
export const getFollowing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || PAGINATION_DEFAULTS.PAGE;
  const limit = parseInt(req.query.limit) || PAGINATION_DEFAULTS.LIMIT;
  const skip = (page - 1) * limit;

  const user = await User.findById(id)
    .select('following')
    .populate({
      path: 'following',
      select: 'username name avatar bio skills isOnline',
      options: { skip, limit },
    })
    .lean();

  if (!user) throw ApiError.notFound('User not found');

  const total = user.following.length;

  return sendResponse(res, 200, 'Following fetched', {
    following: user.following,
    pagination: buildPagination(total, page, limit),
  });
});

// ---- GET /api/v1/users/search?q= ----
export const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const page = parseInt(req.query.page) || PAGINATION_DEFAULTS.PAGE;
  const limit = parseInt(req.query.limit) || PAGINATION_DEFAULTS.LIMIT;
  const skip = (page - 1) * limit;

  if (!q || q.trim().length < 1) {
    throw ApiError.badRequest('Search query is required');
  }

  const query = {
    $text: { $search: q },
  };

  const [users, total] = await Promise.all([
    User.find(query, { score: { $meta: 'textScore' } })
      .select('-password -refreshToken')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  return sendResponse(res, 200, 'Search results', {
    users,
    pagination: buildPagination(total, page, limit),
  });
});

// ---- Helper ----
const buildPagination = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});
