// ============================================================
// middleware/validate.middleware.js
// Runs express-validator results and throws on failure
// ============================================================

import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

/**
 * Place this middleware AFTER your express-validator chain.
 * If any validation rule failed, it collects all errors and
 * throws a 400 ApiError. Otherwise it calls next().
 */
const validate = (req, _res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    throw ApiError.badRequest('Validation failed', errors);
  }

  next();
};

export default validate;
