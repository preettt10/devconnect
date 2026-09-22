// ============================================================
// routes/post.routes.js
// ============================================================

import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllPosts,
  createPost,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
  toggleBookmark,
  getFeed,
  searchPosts,
  getPostsByUser,
  uploadCoverImage,
  getBookmarks,
} from '../controllers/post.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';

const router = Router();

// ---- Validation chains ----
const createPostValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 150 }).withMessage('Title must be at most 150 characters'),
  body('content')
    .notEmpty().withMessage('Content is required'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
];

const updatePostValidation = [
  body('title').optional().trim().isLength({ max: 150 }).withMessage('Title too long'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
];

// ---- Static routes first (must come before param routes) ----
router.get('/feed', verifyJWT, getFeed);
router.get('/bookmarks', verifyJWT, getBookmarks);
router.get('/search', searchPosts);
router.get('/user/:userId', getPostsByUser);

// ---- CRUD ----
router.get('/', getAllPosts);
router.post('/', verifyJWT, createPostValidation, validate, createPost);
router.get('/:id', getPostById);
router.put('/:id', verifyJWT, updatePostValidation, validate, updatePost);
router.delete('/:id', verifyJWT, deletePost);

// ---- Actions ----
router.post('/:id/like', verifyJWT, toggleLike);
router.post('/:id/bookmark', verifyJWT, toggleBookmark);
router.post('/:id/cover', verifyJWT, uploadSingle('cover'), uploadCoverImage);

export default router;
