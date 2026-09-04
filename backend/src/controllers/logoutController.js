const logoutService = require("../services/logoutService");
const asyncHandler = require("../middleware/asyncHandler");

exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await logoutService.logout(refreshToken);

  return res.status(200).json(result);
});
