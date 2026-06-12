/**
 * middleware/validate.js — express-validator result checker
 * Call this after your validation chain in routes.
 */

const { validationResult } = require('express-validator');
const { ApiResponse } = require('../utils/apiResponse');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return ApiResponse.badRequest(res, 'Validation failed', formattedErrors);
  }
  next();
};

module.exports = validate;
