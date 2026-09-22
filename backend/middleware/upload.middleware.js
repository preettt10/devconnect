// ============================================================
// middleware/upload.middleware.js
// Multer in-memory storage for Cloudinary stream uploads
// ============================================================

import multer from 'multer';
import ApiError from '../utils/ApiError.js';

// Use memory storage — files are kept in buffer, never written to disk.
// We stream directly to Cloudinary.
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
});

/**
 * uploadSingle(fieldName) — middleware factory for single file upload.
 * Usage: router.post('/avatar', uploadSingle('avatar'), controller)
 */
export const uploadSingle = (fieldName) => upload.single(fieldName);

/**
 * uploadMultiple(fieldName, maxCount) — middleware factory for multiple files.
 */
export const uploadMultiple = (fieldName, maxCount = 5) =>
  upload.array(fieldName, maxCount);

export default upload;
