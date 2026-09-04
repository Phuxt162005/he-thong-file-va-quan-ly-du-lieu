const PasswordResetToken = require("../models/PasswordResetToken");

exports.create = (data) => {
  return PasswordResetToken.create(data);
};

exports.findValidToken = (tokenHash) => {
  return PasswordResetToken.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
};

exports.markUsed = (id) => {
  return PasswordResetToken.findOneAndUpdate(
    { _id: id, usedAt: null },
    { $set: { usedAt: new Date() } },
    { new: true },
  );
};

exports.revokeAllByUser = (userId) => {
  return PasswordResetToken.updateMany(
    { user: userId, usedAt: null },
    { $set: { usedAt: new Date() } },
  );
};
