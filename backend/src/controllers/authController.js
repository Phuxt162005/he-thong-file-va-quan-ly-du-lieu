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

exports.register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return res
      .status(400)
      .json({ message: "Username, email and password are required" });
  }

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedUsername) {
    return res.status(400).json({ message: "Username is required" });
  }
  if (normalizedUsername.length < 3 || normalizedUsername.length > 50) {
    return res
      .status(400)
      .json({ message: "Username must be between 3 and 50 characters" });
  }
  if (!normalizedEmail) {
    return res.status(400).json({ message: "Email is required" });
  }
  if (
    normalizedEmail.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    return res.status(400).json({ message: "Invalid email" });
  }
  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters" });
  }

  const user = await authService.register(
    normalizedUsername,
    normalizedEmail,
    password,
  );

  return res.status(201).json({ message: "Registration successful", user });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (typeof email !== "string" || !email.trim()) {
    return res.status(400).json({
      message: "Email is required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({
      message: "Invalid email",
    });
  }

  const result = await authService.forgotPassword(normalizedEmail);

  return res.status(200).json({
    message: "Password reset request created",
    ...result,
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body;

  if (typeof resetToken !== "string" || !resetToken.trim()) {
    return res.status(400).json({ message: "Reset token is required" });
  }
  if (typeof newPassword !== "string") {
    return res.status(400).json({ message: "New password is required" });
  }
  if (typeof confirmPassword !== "string") {
    return res.status(400).json({ message: "Confirm password is required" });
  }

  const result = await authService.resetPassword(
    resetToken.trim(),
    newPassword,
    confirmPassword,
  );

  return res.status(200).json(result);
});
