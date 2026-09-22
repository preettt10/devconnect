// ============================================================
// routes/user.routes.js
// ============================================================

import { Router } from 'express';
import { body } from 'express-validator';
import {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  toggleFollow,
  getFollowers,
  getFollowing,
  searchUsers,
} from '../controllers/user.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';

const router = Router();

// ---- Validation chains ----
const updateProfileValidation = [
  body('name').optional().trim().isLength({ max: 60 }).withMessage('Name too long'),
  body('bio').optional().trim().isLength({ max: 300 }).withMessage('Bio too long'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('githubUrl')
    .optional()
    .trim()
    .custom((value) => {
      if (!value || value === '') return true;
      try { new URL(value); return true; } catch { return false; }
    })
    .withMessage('Invalid GitHub URL'),
  body('portfolioUrl')
    .optional()
    .trim()
    .custom((value) => {
      if (!value || value === '') return true;
      try { new URL(value); return true; } catch { return false; }
    })
    .withMessage('Invalid portfolio URL'),
];

// GET /api/v1/users/search  — must be BEFORE /:username to avoid conflict
router.get('/search', searchUsers);

// GET /api/v1/users/:username
router.get('/:username', getUserProfile);

// PUT /api/v1/users/profile
router.put('/profile', verifyJWT, updateProfileValidation, validate, updateProfile);

// POST /api/v1/users/avatar
router.post('/avatar', verifyJWT, uploadSingle('avatar'), uploadAvatar);

// DELETE /api/v1/users/avatar
router.delete('/avatar', verifyJWT, deleteAvatar);

// POST /api/v1/users/:id/follow
router.post('/:id/follow', verifyJWT, toggleFollow);

// GET /api/v1/users/:id/followers
router.get('/:id/followers', getFollowers);

// GET /api/v1/users/:id/following
router.get('/:id/following', getFollowing);

export default router;
