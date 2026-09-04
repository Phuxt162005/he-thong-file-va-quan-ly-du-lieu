const RefreshToken = require("../models/RefreshToken");

exports.findValidToken = async (token) => {
  return RefreshToken.findOne({
    token,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
};

exports.revoke = async (token) => {
  return RefreshToken.findOneAndUpdate(
    { token, revokedAt: null },
    { $set: { revokedAt: new Date() } },
    { new: true },
  );
};

exports.revokeAllByUser = async (userId) => {
  return RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
};
