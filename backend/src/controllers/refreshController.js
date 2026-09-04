const refreshService = require("../services/refreshService");
const asyncHandler = require("../middleware/asyncHandler");

exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await refreshService.refreshAccessToken(refreshToken);

  return res.status(200).json(result);
});
