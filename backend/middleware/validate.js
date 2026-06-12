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
