/**
 * middleware/notFound.js — 404 handler
 */

const { AppError } = require('../utils/apiResponse');

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

module.exports = notFound;
