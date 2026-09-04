const authService = require("../services/authService");
const asyncHandler = require("../middleware/asyncHandler");

exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !password
  ) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  const ipAddress =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    req.ip;

  const result = await authService.login(username.trim(), password, ipAddress);

  return res.status(200).json(result);
});
