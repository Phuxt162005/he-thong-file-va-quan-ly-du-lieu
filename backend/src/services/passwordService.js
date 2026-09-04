const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userRepository = require("../repositories/userRepository");
const passwordResetTokenRepository = require("../repositories/passwordResetTokenRepository");
const auditLogService = require("./auditLogService");
const httpError = require("../utils/httpError");

const validatePassword = (password) => {
  if (typeof password !== "string" || !password) {
    throw httpError("Password is required", 400);
  }
  if (password.length < 8 || password.length > 128) {
    throw httpError("Password must be between 8 and 128 characters", 400);
  }
};

exports.changePassword = async (
  userId,
  currentPassword,
  newPassword,
  ipAddress = null,
) => {
  if (!userId) {
    throw httpError("User ID is required", 400);
  }
  validatePassword(currentPassword);
  validatePassword(newPassword);
  if (currentPassword === newPassword) {
    throw httpError(
      "New password must be different from current password",
      400,
    );
  }

  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) {
    throw httpError("User not found", 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    await auditLogService.log({
      userId,
      action: "CHANGE_PASSWORD",
      result: "FAILED",
      ipAddress,
    });
    throw httpError("Current password is incorrect", 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await userRepository.updatePassword(userId, hashedPassword);
  await passwordResetTokenRepository.revokeAllByUser(userId);
  await auditLogService.log({
    userId,
    action: "CHANGE_PASSWORD",
    result: "SUCCESS",
    ipAddress,
  });

  return { message: "Password changed successfully" };
};

exports.requestPasswordReset = async (email, ipAddress = null) => {
  if (typeof email !== "string" || !email.trim()) {
    throw httpError("Email is required", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const User = require("../models/User");
  const user = await User.findOne({ email: normalizedEmail });
  // Không tiết lộ email có tồn tại hay không.
  if (!user) {
    return {
      message: "If the email exists, a password reset link has been generated",
    };
  }

  await passwordResetTokenRepository.revokeAllByUser(user._id);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await passwordResetTokenRepository.create({
    user: user._id,
    tokenHash,
    expiresAt,
  });
  await auditLogService.log({
    userId: user._id,
    action: "PASSWORD_RESET_REQUEST",
    result: "SUCCESS",
    ipAddress,
  });
  return {
    message: "If the email exists, a password reset link has been generated",
    resetToken: rawToken,
  };
};

exports.resetPassword = async (resetToken, newPassword, ipAddress = null) => {
  if (typeof resetToken !== "string" || !resetToken.trim()) {
    throw httpError("Reset token is required", 400);
  }
  validatePassword(newPassword);

  const tokenHash = crypto
    .createHash("sha256")
    .update(resetToken.trim())
    .digest("hex");
  const token = await passwordResetTokenRepository.findValidToken(tokenHash);
  if (!token) {
    throw httpError("Invalid or expired reset token", 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const user = await userRepository.updatePassword(token.user, hashedPassword);
  if (!user) {
    throw httpError("User not found", 404);
  }

  await passwordResetTokenRepository.markUsed(token._id);
  await passwordResetTokenRepository.revokeAllByUser(token.user);
  await auditLogService.log({
    userId: token.user,
    action: "PASSWORD_RESET",
    result: "SUCCESS",
    ipAddress,
  });
  return { message: "Password reset successfully" };
};
