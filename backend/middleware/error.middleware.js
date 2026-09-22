// ============================================================
// middleware/error.middleware.js
// Global error handler — must be registered LAST in Express
// ============================================================

import ApiError from '../utils/ApiError.js';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Converts known Mongoose / JWT errors into structured ApiErrors
 * and sends a consistent JSON error response.
 *
 * Handled error types:
 *  - CastError       → 400  (invalid MongoDB ObjectId)
 *  - ValidationError → 422  (Mongoose schema validation)
 *  - code 11000      → 409  (duplicate key)
 *  - JsonWebTokenError / TokenExpiredError → 401
 *  - ApiError        → uses its own statusCode
 *  - Everything else → 500
 */
const errorMiddleware = (err, req, res, _next) => {
  let error = err;

  // ---- Transform known error types into ApiError ----

  // Mongoose: invalid ObjectId (e.g., badly-formed _id in route param)
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid value for field: ${err.path}`);
  }

  // Mongoose: schema validation failure
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = new ApiError(422, 'Validation failed', errors);
  }

  // MongoDB: duplicate key (email / username already taken)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    error = ApiError.conflict(`${field} '${value}' is already taken`);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token has expired');
  }

  // ---- Build response ----
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errors = error.errors || [];

  const body = {
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(isDev && { stack: err.stack }), // Stack only in development
  };

  console.error(`[${req.method}] ${req.originalUrl} → ${statusCode}: ${message}`);

  return res.status(statusCode).json(body);
};

export default errorMiddleware;
