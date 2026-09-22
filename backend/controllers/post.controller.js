// ============================================================
// controllers/post.controller.js
// ============================================================

import Post from '../models/Post.model.js';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import Comment from '../models/Comment.model.js';
import sendResponse from '../utils/sendResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { cloudinary } from '../config/cloudinary.js';
import { NOTIFICATION_TYPES, PAGINATION_DEFAULTS, UPLOAD_PRESETS } from '../constants.js';
import streamifier from 'streamifier';

// ---- Helper: standard pagination object ----
const buildPagination = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

// ---- GET /api/v1/posts ----
export const getAllPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || PAGINATION_DEFAULTS.PAGE;
  const limit = Math.min(parseInt(req.query.limit) || PAGINATION_DEFAULTS.LIMIT, PAGINATION_DEFAULTS.MAX_LIMIT);
  const sort = req.query.sort || 'createdAt';
  const order = req.query.order === 'asc' ? 1 : -1;
  const skip = (page - 1) * limit;

  const sortObj = { [sort]: order };

  const [posts, total] = await Promise.all([
    Post.find()
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar')
      .lean(),
    Post.countDocuments(),
  ]);

  return sendResponse(res, 200, 'Posts fetched', {
    posts,
    pagination: buildPagination(total, page, limit),
  });
});

// ---- POST /api/v1/posts ----
export const createPost = asyncHandler(async (req, res) => {
  const { title, content, tags } = req.body;

  const post = await Post.create({
    author: req.user._id,
    title,
    content,
    tags: tags || [],
  });

  await post.populate('author', 'username name avatar');

  return sendResponse(res, 201, 'Post created successfully', { post });
});

// ---- GET /api/v1/posts/:id ----
export const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate('author', 'username name avatar bio')
    .lean();

  if (!post) throw ApiError.notFound('Post not found');

  return sendResponse(res, 200, 'Post fetched', { post });
});

// ---- PUT /api/v1/posts/:id ----
export const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');

  if (post.author.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only edit your own posts');
  }

  const allowedFields = ['title', 'content', 'tags', 'coverImage'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) post[field] = req.body[field];
  });

  await post.save();
  await post.populate('author', 'username name avatar');

  return sendResponse(res, 200, 'Post updated successfully', { post });
});

// ---- DELETE /api/v1/posts/:id ----
export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');

  if (post.author.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only delete your own posts');
  }

  // Delete post and all its comments
  await Promise.all([
    post.deleteOne(),
    Comment.deleteMany({ post: post._id }),
    Notification.deleteMany({ post: post._id }),
  ]);

  return sendResponse(res, 200, 'Post deleted successfully');
});

// ---- POST /api/v1/posts/:id/like ----
export const toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');

  const userId = req.user._id;
  const alreadyLiked = post.likes.some((id) => id.toString() === userId.toString());

  if (alreadyLiked) {
    post.likes.pull(userId);
    await post.save();
    return sendResponse(res, 200, 'Post unliked', { liked: false, likeCount: post.likes.length });
  } else {
    post.likes.addToSet(userId);
    await post.save();

    // Notify post author (not self)
    if (post.author.toString() !== userId.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: userId,
        type: NOTIFICATION_TYPES.LIKE,
        post: post._id,
      });

      const io = req.app.get('io');
      if (io) {
        const sender = await User.findById(userId).select('username name avatar').lean();
        io.to(post.author.toString()).emit('notification:new', {
          type: NOTIFICATION_TYPES.LIKE,
          sender,
          post: { _id: post._id, title: post.title },
          message: `${sender.name} liked your post`,
        });
      }
    }

    return sendResponse(res, 200, 'Post liked', { liked: true, likeCount: post.likes.length });
  }
});

// ---- POST /api/v1/posts/:id/bookmark ----
export const toggleBookmark = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');

  const userId = req.user._id;
  const alreadyBookmarked = post.bookmarks.some((id) => id.toString() === userId.toString());

  if (alreadyBookmarked) {
    post.bookmarks.pull(userId);
    await post.save();
    return sendResponse(res, 200, 'Bookmark removed', { bookmarked: false });
  } else {
    post.bookmarks.addToSet(userId);
    await post.save();
    return sendResponse(res, 200, 'Post bookmarked', { bookmarked: true });
  }
});

// ---- GET /api/v1/posts/feed ----
export const getFeed = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || PAGINATION_DEFAULTS.PAGE;
  const limit = Math.min(parseInt(req.query.limit) || PAGINATION_DEFAULTS.LIMIT, PAGINATION_DEFAULTS.MAX_LIMIT);
  const skip = (page - 1) * limit;

  const currentUser = await User.findById(req.user._id).select('following').lean();
  const followingIds = currentUser.following;

  if (followingIds.length === 0) {
    return sendResponse(res, 200, 'Feed fetched (no follows yet)', {
      posts: [],
      pagination: buildPagination(0, page, limit),
    });
  }

  const query = { author: { $in: followingIds } };

  const [posts, total] = await Promise.all([
    Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar')
      .lean(),
    Post.countDocuments(query),
  ]);

  return sendResponse(res, 200, 'Feed fetched', {
    posts,
    pagination: buildPagination(total, page, limit),
  });
});

// ---- GET /api/v1/posts/search?q=&tags= ----
export const searchPosts = asyncHandler(async (req, res) => {
  const { q, tags } = req.query;
  const page = parseInt(req.query.page) || PAGINATION_DEFAULTS.PAGE;
  const limit = Math.min(parseInt(req.query.limit) || PAGINATION_DEFAULTS.LIMIT, PAGINATION_DEFAULTS.MAX_LIMIT);
  const skip = (page - 1) * limit;

  if (!q && !tags) throw ApiError.badRequest('Provide a search query or tags');

  const query = {};

  if (q) {
    query.$text = { $search: q };
  }

  if (tags) {
    const tagList = tags.split(',').map((t) => t.trim().toLowerCase());
    query.tags = { $in: tagList };
  }

  const sortObj = q ? { score: { $meta: 'textScore' } } : { createdAt: -1 };
  const projection = q ? { score: { $meta: 'textScore' } } : {};

  const [posts, total] = await Promise.all([
    Post.find(query, projection)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar')
      .lean(),
    Post.countDocuments(query),
  ]);

  return sendResponse(res, 200, 'Search results', {
    posts,
    pagination: buildPagination(total, page, limit),
  });
});

// ---- GET /api/v1/posts/user/:userId ----
export const getPostsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || PAGINATION_DEFAULTS.PAGE;
  const limit = Math.min(parseInt(req.query.limit) || PAGINATION_DEFAULTS.LIMIT, PAGINATION_DEFAULTS.MAX_LIMIT);
  const skip = (page - 1) * limit;

  const query = { author: userId };

  const [posts, total] = await Promise.all([
    Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar')
      .lean(),
    Post.countDocuments(query),
  ]);

  return sendResponse(res, 200, 'User posts fetched', {
    posts,
    pagination: buildPagination(total, page, limit),
  });
});

// ---- POST /api/v1/posts/:id/cover ----
export const uploadCoverImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image file provided');

  const post = await Post.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');

  if (post.author.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only upload covers for your own posts');
  }

  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: UPLOAD_PRESETS.COVER,
        transformation: [{ width: 1200, height: 630, crop: 'fill' }],
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  });

  post.coverImage = uploadResult.secure_url;
  await post.save();

  return sendResponse(res, 200, 'Cover image uploaded', {
    coverImage: uploadResult.secure_url,
  });
});

// ---- GET /api/v1/posts/bookmarks ----
export const getBookmarks = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || PAGINATION_DEFAULTS.PAGE;
  const limit = Math.min(parseInt(req.query.limit) || PAGINATION_DEFAULTS.LIMIT, PAGINATION_DEFAULTS.MAX_LIMIT);
  const skip = (page - 1) * limit;

  const query = { bookmarks: req.user._id };

  const [posts, total] = await Promise.all([
    Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar')
      .lean(),
    Post.countDocuments(query),
  ]);

  return sendResponse(res, 200, 'Bookmarked posts fetched', {
    posts,
    pagination: buildPagination(total, page, limit),
  });
});
