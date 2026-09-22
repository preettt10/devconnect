// ============================================================
// utils/asyncHandler.js — Wraps async controllers to avoid
// repetitive try/catch blocks. Passes errors to next().
// ============================================================

/**
 * @param {Function} fn - async Express route handler
 * @returns {Function}  - wrapped handler that catches errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
