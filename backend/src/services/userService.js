const userRepository = require("../repositories/userRepository");

// lấy hồ sơ người dùng
exports.getProfile = async (req, res) => {
  try {
    const user = await userService.getProfile(req.user.id);
    return res.json(user);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// tìm người dùng theo tên đăng nhập
exports.findByLoginName = async (username) => {
  if (!username) {
    throw new Error("Username is required");
  }
  return await userRepository.findByLoginName(username.trim());
};

// cập nhật hồ sơ
exports.updateProfile = async (id, data) => {
  return await userRepository.updateProfile(id, data);
};
