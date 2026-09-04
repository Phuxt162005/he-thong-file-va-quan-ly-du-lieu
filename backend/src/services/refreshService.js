const jwt = require("jsonwebtoken");
const User = require("../models/User");

const refreshTokenRepository = require("../repositories/refreshTokenRepository");
const httpError = require("../utils/httpError");

exports.refreshAccessToken = async (refreshToken) => {
  if (typeof refreshToken !== "string" || !refreshToken.trim()) {
    throw httpError("Refresh token is required", 400);
  }
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT secret is not configured");
  }

  const token = await refreshTokenRepository.findValidToken(
    refreshToken.trim(),
  );
  if (!token) {
    throw httpError("Invalid or expired refresh token", 401);
  }

  const user = await User.findById(token.user);
  if (!user) {
    throw httpError("User not found", 404);
  }

  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  return { token: accessToken };
};
