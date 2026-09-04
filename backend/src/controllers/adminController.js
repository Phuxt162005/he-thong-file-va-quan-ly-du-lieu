const adminService = require("../services/adminService");
const asyncHandler = require("../middleware/asyncHandler");

const getIpAddress = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    req.ip
  );
};

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await adminService.getUsers();

  return res.json({ users });
});

exports.getUser = asyncHandler(async (req, res) => {
  const user = await adminService.getUser(req.params.id);

  return res.json(user);
});

exports.createUser = asyncHandler(async (req, res) => {
  const user = await adminService.createUser(
    req.body,
    req.user.id,
    getIpAddress(req),
  );

  return res.status(201).json({ message: "User created successfully", user });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const user = await adminService.updateUser(
    req.params.id,
    req.body,
    req.user.id,
    getIpAddress(req),
  );

  return res.json({ message: "User updated successfully", user });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const result = await adminService.deleteUser(
    req.params.id,
    req.user.id,
    getIpAddress(req),
  );

  return res.json(result);
});

exports.getStorageStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getStorageStats();

  return res.json(stats);
});

exports.getSystemStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getSystemStats();

  return res.json(stats);
});
