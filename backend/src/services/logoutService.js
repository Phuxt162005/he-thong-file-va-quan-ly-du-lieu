const refreshTokenRepository = require("../repositories/refreshTokenRepository");
const httpError = require("../utils/httpError");

exports.logout = async (refreshToken) => {
  if (typeof refreshToken !== "string" || !refreshToken.trim()) {
    throw httpError("Refresh token is required", 400);
  }

  const revokedToken = await refreshTokenRepository.revoke(refreshToken.trim());
  if (!revokedToken) {
    throw httpError("Invalid or already revoked refresh token", 401);
  }

  return { message: "Logout successful" };
};
