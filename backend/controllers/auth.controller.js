// ============================================================
// controllers/auth.controller.js
// Handles: register, login, refresh token, logout, /me
// ============================================================

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.model.js';
import { generateTokenPair } from '../utils/generateToken.js';
import sendResponse from '../utils/sendResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_MAX_AGE,
} from '../constants.js';

// ---- Helpers ----

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,            // Not accessible via JS
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict',
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};

// ---- Controllers ----

/**
 * POST /api/v1/auth/register
 * Creates a new user account.
 */
export const register = asyncHandler(async (req, res) => {
  const { username, email, password, name } = req.body;

  // Check for existing user (email or username)
  const existing = await User.findOne({
    $or: [{ email }, { username }],
  }).lean();

  if (existing) {
    if (existing.email === email) {
      throw ApiError.conflict('Email is already registered');
    }
    throw ApiError.conflict('Username is already taken');
  }

  const user = await User.create({ username, email, password, name });

  const { accessToken, refreshToken } = generateTokenPair(user);

  // Save refresh token to DB for rotation/revocation
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, refreshToken);

  const userPayload = {
    _id: user._id,
    username: user.username,
    email: user.email,
    name: user.name,
    bio: user.bio,
    avatar: user.avatar,
    skills: user.skills,
    githubUrl: user.githubUrl,
    portfolioUrl: user.portfolioUrl,
    followers: [],
    following: [],
    isOnline: true,
    createdAt: user.createdAt,
  };

  return sendResponse(res, 201, 'Account created successfully', {
    user: userPayload,
    accessToken,
  });
});

/**
 * POST /api/v1/auth/login
 * Authenticates user and returns access + refresh tokens.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Explicitly select password (it's excluded by default)
  const user = await User.findOne({ email }).select('+password +refreshToken');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const { accessToken, refreshToken } = generateTokenPair(user);

  // Update refresh token + online status
  user.refreshToken = refreshToken;
  user.isOnline = true;
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, refreshToken);

  const userPayload = {
    _id: user._id,
    username: user.username,
    email: user.email,
    name: user.name,
    bio: user.bio,
    avatar: user.avatar,
    skills: user.skills,
    githubUrl: user.githubUrl,
    portfolioUrl: user.portfolioUrl,
    followers: user.followers,
    following: user.following,
    isOnline: true,
    createdAt: user.createdAt,
  };

  return sendResponse(res, 200, 'Login successful', {
    user: userPayload,
    accessToken,
  });
});

/**
 * POST /api/v1/auth/refresh
 * Rotates the refresh token and returns a new access token.
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies[REFRESH_COOKIE_NAME];

  if (!incomingRefreshToken) {
    throw ApiError.unauthorized('Refresh token not found');
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  // Find user and verify stored refresh token matches
  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== incomingRefreshToken) {
    // Possible token reuse attack — clear cookie
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Refresh token reuse detected. Please log in again.');
  }

  // Issue new token pair (rotation)
  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, newRefreshToken);

  return sendResponse(res, 200, 'Token refreshed', { accessToken });
});

/**
 * POST /api/v1/auth/logout
 * Invalidates refresh token in DB and clears cookie.
 */
export const logout = asyncHandler(async (req, res) => {
  const user = req.user; // Set by verifyJWT middleware

  await User.findByIdAndUpdate(user._id, {
    refreshToken: '',
    isOnline: false,
    lastSeen: new Date(),
  });

  clearRefreshCookie(res);

  return sendResponse(res, 200, 'Logged out successfully');
});

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's profile.
 */
export const getMe = asyncHandler(async (req, res) => {
  // req.user is already populated by verifyJWT (without password/refreshToken)
  return sendResponse(res, 200, 'User profile fetched', { user: req.user });
});

let transporterInstance = null;

const getTransporter = async () => {
  if (transporterInstance) return transporterInstance;

  const testAccount = await nodemailer.createTestAccount();
  transporterInstance = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  return transporterInstance;
};

/**
 * POST /api/v1/auth/forgot-password
 * Generates token and prints a test reset link to the console.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return sendResponse(res, 200, 'If that email exists, a password reset link has been generated.');
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: '"DevConnect Support" <noreply@devconnect.com>',
      to: email,
      subject: 'DevConnect Password Reset Request',
      text: `You requested a password reset. Please click on this link to reset your password: ${resetUrl}`,
      html: `<p>You requested a password reset. Please click on the link below to reset your password:</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>This link will expire in 1 hour.</p>`,
    });

    console.log('\n✉️  Password Reset Email Sent to Ethereal:');
    console.log(`- Recipient: ${email}`);
    console.log(`- Preview URL: ${nodemailer.getTestMessageUrl(info)}\n`);
  } catch (error) {
    console.error('SMTP Error, fallback to direct console log:', error.message);
    console.log(`\n🔑 Reset Link for ${email}:\n  ${resetUrl}\n`);
  }

  return sendResponse(res, 200, 'If that email exists, a password reset link has been generated.');
});

/**
 * POST /api/v1/auth/reset-password
 * Verifies reset token and updates user's password.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw ApiError.badRequest('Token and password are required');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+password +resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return sendResponse(res, 200, 'Password has been reset successfully. You can now log in.');
});
