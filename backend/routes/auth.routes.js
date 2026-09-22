// ============================================================
// routes/auth.routes.js
// ============================================================

import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';

const router = Router();

// ---- Validation chains ----

const registerValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters')
    .matches(/^[a-z0-9_]+$/).withMessage('Username may only contain lowercase letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 60 }).withMessage('Name must be at most 60 characters'),
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
];

const resetPasswordValidation = [
  body('token')
    .notEmpty().withMessage('Token is required'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// ---- Routes ----

// POST /api/v1/auth/register
router.post('/register', registerValidation, validate, register);

// POST /api/v1/auth/login
router.post('/login', loginValidation, validate, login);

// POST /api/v1/auth/refresh  — no auth needed (refresh token in cookie)
router.post('/refresh', refreshToken);

// POST /api/v1/auth/logout  — must be logged in
router.post('/logout', verifyJWT, logout);

// GET /api/v1/auth/me  — must be logged in
router.get('/me', verifyJWT, getMe);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);

// POST /api/v1/auth/reset-password
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);

export default router;
