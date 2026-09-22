// ============================================================
// routes/comment.routes.js
// ============================================================

import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCommentsByPost,
  addComment,
  editComment,
  deleteComment,
  toggleCommentLike,
  replyToComment,
} from '../controllers/comment.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = Router();

const contentValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content is required')
    .isLength({ max: 1000 }).withMessage('Comment must be at most 1000 characters'),
];

// GET /api/v1/comments/post/:postId
router.get('/post/:postId', getCommentsByPost);

// POST /api/v1/comments/post/:postId
router.post('/post/:postId', verifyJWT, contentValidation, validate, addComment);

// PUT /api/v1/comments/:id
router.put('/:id', verifyJWT, contentValidation, validate, editComment);

// DELETE /api/v1/comments/:id
router.delete('/:id', verifyJWT, deleteComment);

// POST /api/v1/comments/:id/like
router.post('/:id/like', verifyJWT, toggleCommentLike);

// POST /api/v1/comments/:id/reply
router.post('/:id/reply', verifyJWT, contentValidation, validate, replyToComment);

export default router;
