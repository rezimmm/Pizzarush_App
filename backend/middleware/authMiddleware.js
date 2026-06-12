const { verifyAccessToken } = require('../utils/jwtHelper');
const { AppError } = require('../utils/apiResponse');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    // Also check cookies
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new AppError('Access denied. No token provided.', 401));
  }

  try {
    const decoded = verifyAccessToken(token);

    // Fetch user from DB (to check if still active/existing)
    const user = await User.findById(decoded.id).select('-password -refreshTokens');

    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 403));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please login again.', 401));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please login again.', 401));
    }
    return next(new AppError('Authentication failed.', 401));
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return next(new AppError('Please verify your email address before proceeding.', 403));
  }
  next();
};

module.exports = { protect, restrictTo, requireVerified };
