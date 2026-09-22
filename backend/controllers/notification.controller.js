// ============================================================
// controllers/notification.controller.js
// ============================================================

import Notification from '../models/Notification.model.js';
import sendResponse from '../utils/sendResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { PAGINATION_DEFAULTS } from '../constants.js';

const buildPagination = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

// ---- GET /api/v1/notifications ----
export const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || PAGINATION_DEFAULTS.PAGE;
  const limit = parseInt(req.query.limit) || PAGINATION_DEFAULTS.LIMIT;
  const skip = (page - 1) * limit;

  const query = { recipient: req.user._id };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username name avatar')
      .populate('post', 'title')
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ ...query, isRead: false }),
  ]);

  return sendResponse(res, 200, 'Notifications fetched', {
    notifications,
    unreadCount,
    pagination: buildPagination(total, page, limit),
  });
});

// ---- PUT /api/v1/notifications/:id/read ----
export const markOneAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) throw ApiError.notFound('Notification not found');

  return sendResponse(res, 200, 'Notification marked as read', { notification });
});

// ---- PUT /api/v1/notifications/read-all ----
export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  return sendResponse(res, 200, 'All notifications marked as read', {
    modifiedCount: result.modifiedCount,
  });
});

// ---- DELETE /api/v1/notifications/:id ----
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) throw ApiError.notFound('Notification not found');

  return sendResponse(res, 200, 'Notification deleted');
});
