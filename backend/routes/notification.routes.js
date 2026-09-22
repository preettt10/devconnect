// ============================================================
// routes/notification.routes.js
// ============================================================

import { Router } from 'express';
import {
  getNotifications,
  markOneAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notification.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// All notification routes require authentication
router.use(verifyJWT);

// GET /api/v1/notifications
router.get('/', getNotifications);

// PUT /api/v1/notifications/read-all  — must be before /:id
router.put('/read-all', markAllAsRead);

// PUT /api/v1/notifications/:id/read
router.put('/:id/read', markOneAsRead);

// DELETE /api/v1/notifications/:id
router.delete('/:id', deleteNotification);

export default router;
