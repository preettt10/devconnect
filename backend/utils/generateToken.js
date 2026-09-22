// ============================================================
// utils/generateToken.js — JWT access + refresh token helpers
// ============================================================

import jwt from 'jsonwebtoken';
import { JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } from '../constants.js';

/**
 * Generates a short-lived access token (15 min) containing
 * the user's id and username — stored in React memory/cache.
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRY }
  );
};

/**
 * Generates a long-lived refresh token (7 days) — stored in
 * an httpOnly cookie, also saved to the DB for rotation/revocation.
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRY }
  );
};

/**
 * Generates both tokens at once and returns them as an object.
 */
export const generateTokenPair = (user) => ({
  accessToken: generateAccessToken(user),
  refreshToken: generateRefreshToken(user),
});
