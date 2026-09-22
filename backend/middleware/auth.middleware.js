// ============================================================
// middleware/auth.middleware.js
// Verifies JWT access token and attaches req.user
// ============================================================

import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * verifyJWT — Extracts Bearer token from Authorization header,
 * verifies it, loads the user from DB, and attaches to req.user.
 * Throws 401 if token is missing, invalid, or expired.
 */
export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Access token missing or malformed');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token expired');
    }
    throw ApiError.unauthorized('Invalid access token');
  }

  // Load user — exclude password and refreshToken
  const user = await User.findById(decoded.id).select('-password -refreshToken');

  if (!user) {
    throw ApiError.unauthorized('User belonging to this token no longer exists');
  }

  req.user = user;
  next();
});

/**
 * checkOwnership — Middleware factory that verifies the logged-in
 * user owns the resource. Pass a function that extracts the owner
 * ID from the request.
 *
 * Usage: checkOwnership((req) => req.resource.author.toString())
 */
export const checkOwnership = (getOwnerId) =>
  asyncHandler(async (req, _res, next) => {
    const ownerId = getOwnerId(req);

    if (!ownerId || ownerId !== req.user._id.toString()) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }

    next();
  });
