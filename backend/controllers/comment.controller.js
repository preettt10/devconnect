// ============================================================
// controllers/comment.controller.js
// ============================================================

import Comment from '../models/Comment.model.js';
import Post from '../models/Post.model.js';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import sendResponse from '../utils/sendResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { NOTIFICATION_TYPES, PAGINATION_DEFAULTS } from '../constants.js';

const buildPagination = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

// ---- GET /api/v1/comments/post/:postId ----
// Returns top-level comments only; replies are nested via parentComment
export const getCommentsByPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const page = parseInt(req.query.page) || PAGINATION_DEFAULTS.PAGE;
  const limit = parseInt(req.query.limit) || PAGINATION_DEFAULTS.LIMIT;
  const skip = (page - 1) * limit;

  const query = { post: postId, parentComment: null };

  const [comments, total] = await Promise.all([
    Comment.find(query)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name avatar')
      .lean(),
    Comment.countDocuments(query),
  ]);

  // For each top-level comment, fetch its replies
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const replies = await Comment.find({ parentComment: comment._id })
        .sort({ createdAt: 1 })
        .populate('author', 'username name avatar')
        .lean();
      return { ...comment, replies };
    })
  );

  return sendResponse(res, 200, 'Comments fetched', {
    comments: commentsWithReplies,
    pagination: buildPagination(total, page, limit),
  });
});

// ---- POST /api/v1/comments/post/:postId ----
export const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  const post = await Post.findById(postId).lean();
  if (!post) throw ApiError.notFound('Post not found');

  const comment = await Comment.create({
    post: postId,
    author: req.user._id,
    content,
  });

  await comment.populate('author', 'username name avatar');

  // Notify post author (not self)
  if (post.author.toString() !== req.user._id.toString()) {
    await Notification.create({
      recipient: post.author,
      sender: req.user._id,
      type: NOTIFICATION_TYPES.COMMENT,
      post: post._id,
    });

    const io = req.app.get('io');
    if (io) {
      const sender = await User.findById(req.user._id).select('username name avatar').lean();
      io.to(post.author.toString()).emit('notification:new', {
        type: NOTIFICATION_TYPES.COMMENT,
        sender,
        post: { _id: post._id, title: post.title },
        message: `${sender.name} commented on your post`,
      });
    }
  }

  return sendResponse(res, 201, 'Comment added', { comment });
});

// ---- PUT /api/v1/comments/:id ----
export const editComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw ApiError.notFound('Comment not found');

  if (comment.author.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only edit your own comments');
  }

  comment.content = req.body.content;
  await comment.save();
  await comment.populate('author', 'username name avatar');

  return sendResponse(res, 200, 'Comment updated', { comment });
});

// ---- DELETE /api/v1/comments/:id ----
export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw ApiError.notFound('Comment not found');

  if (comment.author.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only delete your own comments');
  }

  // deleteOne triggers the post-deleteOne hook which decrements commentsCount
  await comment.deleteOne();

  // Also delete replies if this was a top-level comment
  if (!comment.parentComment) {
    await Comment.deleteMany({ parentComment: comment._id });
  }

  return sendResponse(res, 200, 'Comment deleted');
});

// ---- POST /api/v1/comments/:id/like ----
export const toggleCommentLike = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw ApiError.notFound('Comment not found');

  const userId = req.user._id;
  const alreadyLiked = comment.likes.some((id) => id.toString() === userId.toString());

  if (alreadyLiked) {
    comment.likes.pull(userId);
  } else {
    comment.likes.addToSet(userId);
  }

  await comment.save();

  return sendResponse(res, 200, alreadyLiked ? 'Like removed' : 'Comment liked', {
    liked: !alreadyLiked,
    likeCount: comment.likes.length,
  });
});

// ---- POST /api/v1/comments/:id/reply ----
export const replyToComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const parentComment = await Comment.findById(req.params.id).populate('post').lean();
  if (!parentComment) throw ApiError.notFound('Comment not found');

  const reply = await Comment.create({
    post: parentComment.post._id || parentComment.post,
    author: req.user._id,
    content,
    parentComment: parentComment._id,
  });

  await reply.populate('author', 'username name avatar');

  // Notify the parent comment author
  if (parentComment.author.toString() !== req.user._id.toString()) {
    await Notification.create({
      recipient: parentComment.author,
      sender: req.user._id,
      type: NOTIFICATION_TYPES.REPLY,
      post: parentComment.post._id || parentComment.post,
    });

    const io = req.app.get('io');
    if (io) {
      const sender = await User.findById(req.user._id).select('username name avatar').lean();
      io.to(parentComment.author.toString()).emit('notification:new', {
        type: NOTIFICATION_TYPES.REPLY,
        sender,
        message: `${sender.name} replied to your comment`,
      });
    }
  }

  return sendResponse(res, 201, 'Reply added', { reply });
});
