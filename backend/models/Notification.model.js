// ============================================================
// models/Notification.model.js
// ============================================================

import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../constants.js';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    type: {
      type: String,
      enum: {
        values: Object.values(NOTIFICATION_TYPES),
        message: `Notification type must be one of: ${Object.values(NOTIFICATION_TYPES).join(', ')}`,
      },
      required: [true, 'Notification type is required'],
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ---- Indexes ----
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// ---- TTL index: Auto-delete notifications after 30 days ----
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
