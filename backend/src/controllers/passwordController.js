const passwordService = require("../services/passwordService");
const asyncHandler = require("../middleware/asyncHandler");

const getIpAddress = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    req.ip
  );
};

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      message: "New password and confirmation password do not match",
    });
  }
  const result = await passwordService.changePassword(
    req.user.id,
    currentPassword,
    newPassword,
    getIpAddress(req),
  );

  return res.status(200).json(result);
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await passwordService.requestPasswordReset(
    email,
    getIpAddress(req),
  );
  return res.status(200).json(result);
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({ message: "New password and confirmation password do not match" });
  }

  const result = await passwordService.resetPassword(
    resetToken,
    newPassword,
    getIpAddress(req),
  );
  return res.status(200).json(result);
});
