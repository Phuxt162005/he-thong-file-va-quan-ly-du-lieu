const userService = require("../services/userService");

// lấy thông tin cá nhân
exports.getProfile = async (React, res) => {
  const user = await userService.getProfile(req.user.id);
};

// cập nhật hồ sơ
exports.updateProfile = async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  return res.json(user);
};
