const crypto = require('crypto');
const User = require('../models/User');
const { ApiResponse, AppError } = require('../utils/apiResponse');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenCookieOptions,
} = require('../utils/jwtHelper');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../services/emailService');
const logger = require('../utils/logger');

const sendTokens = async (res, user, statusCode = 200, message = 'Success') => {
  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id, role: user.role });
  const hashedRefreshToken = hashToken(refreshToken);

  // Use atomic updates to prevent VersionError during concurrent requests
  await User.updateOne(
    { _id: user._id },
    {
      $push: {
        refreshTokens: {
          $each: [hashedRefreshToken],
          $slice: -5 // Keep max 5 sessions per user
        }
      },
      $set: { lastLogin: new Date() }
    }
  );

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    avatar: user.avatar,
    phone: user.phone,
  };

  return ApiResponse.success(res, { accessToken, user: userData }, message, statusCode);
};

const register = async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  // Create user
  const user = await User.create({ name, email, password });

  // Generate verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Build verification URL
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

  // Send verification email (non-blocking)
  sendVerificationEmail(user, verificationUrl).catch((err) => {
    logger.error('Failed to send verification email:', err);
  });

  logger.info(`✅ New user registered: ${email}`);

  return ApiResponse.created(
    res,
    { email: user.email },
    'Registration successful! Please check your email to verify your account.'
  );
};

const verifyEmail = async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    return next(new AppError('Verification link is invalid or has expired.', 400));
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  logger.info(`✅ Email verified for user: ${user.email}`);
  return ApiResponse.success(res, {}, 'Email verified successfully! You can now log in.');
};

const resendVerification = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) return next(new AppError('No account found with this email.', 404));
  if (user.isVerified) return next(new AppError('Email is already verified.', 400));

  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  sendVerificationEmail(user, verificationUrl).catch(logger.error);

  return ApiResponse.success(res, {}, 'Verification email resent. Please check your inbox.');
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  // Include password in query (normally excluded)
  const user = await User.findOne({ email }).select('+password +refreshTokens');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 403));
  }

  logger.info(`✅ User logged in: ${email} | Role: ${user.role}`);
  return sendTokens(res, user, 200, 'Login successful');
};

const refreshAccessToken = async (req, res, next) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    return next(new AppError('Refresh token not provided.', 401));
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch {
    return next(new AppError('Invalid or expired refresh token. Please login again.', 401));
  }

  const hashedToken = hashToken(incomingRefreshToken);
  const user = await User.findById(decoded.id).select('+refreshTokens');

  if (!user || !user.refreshTokens.includes(hashedToken)) {
    // Possible token reuse attack — clear all sessions
    if (user) {
      user.refreshTokens = [];
      await user.save({ validateBeforeSave: false });
    }
    return next(new AppError('Session invalid. Please login again.', 401));
  }

  // Rotate refresh token (atomically remove old token)
  await User.updateOne(
    { _id: user._id },
    { $pull: { refreshTokens: hashedToken } }
  );

  return sendTokens(res, user, 200, 'Token refreshed');
};

const logout = async (req, res, next) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (incomingRefreshToken) {
    const hashedToken = hashToken(incomingRefreshToken);
    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== hashedToken);
      await user.save({ validateBeforeSave: false });
    }
  }

  // Clear cookie
  res.clearCookie('refreshToken', { path: '/', httpOnly: true });
  return ApiResponse.success(res, {}, 'Logged out successfully');
};

const logoutAll = async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+refreshTokens');
  user.refreshTokens = [];
  await user.save({ validateBeforeSave: false });
  res.clearCookie('refreshToken', { path: '/', httpOnly: true });
  return ApiResponse.success(res, {}, 'Logged out from all devices');
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    return ApiResponse.success(
      res,
      {},
      'If an account with this email exists, a password reset link has been sent.'
    );
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  sendPasswordResetEmail(user, resetUrl).catch(logger.error);

  return ApiResponse.success(
    res,
    {},
    'If an account with this email exists, a password reset link has been sent.'
  );
};

const resetPassword = async (req, res, next) => {
  const { password } = req.body;
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires +refreshTokens');

  if (!user) {
    return next(new AppError('Password reset link is invalid or has expired.', 400));
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // Invalidate all existing sessions
  await user.save();

  logger.info(`✅ Password reset for: ${user.email}`);
  return ApiResponse.success(res, {}, 'Password reset successful! Please login with your new password.');
};

const getMe = async (req, res, next) => {
  return ApiResponse.success(res, { user: req.user }, 'Profile fetched');
};

const updateProfile = async (req, res, next) => {
  const { name, phone, addresses } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, addresses },
    { new: true, runValidators: true }
  );
  return ApiResponse.success(res, { user }, 'Profile updated successfully');
};

const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 400));
  }

  user.password = newPassword;
  await user.save();

  return ApiResponse.success(res, {}, 'Password changed successfully');
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  refreshAccessToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
};
