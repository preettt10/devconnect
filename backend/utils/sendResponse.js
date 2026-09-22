// ============================================================
// utils/sendResponse.js — Consistent API response wrapper
// ============================================================

/**
 * Sends a standardised JSON response. Controllers must ALWAYS use
 * this helper — never call res.json() directly.
 *
 * @param {import('express').Response} res
 * @param {number}  statusCode   - HTTP status code
 * @param {string}  message      - Human-readable message
 * @param {*}       [data=null]  - Payload to include under "data"
 */
const sendResponse = (res, statusCode, message, data = null) => {
  const body = {
    success: statusCode >= 200 && statusCode < 300,
    message,
  };

  if (data !== null && data !== undefined) {
    body.data = data;
  }

  return res.status(statusCode).json(body);
};

export default sendResponse;
