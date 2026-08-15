const userRepository = require("../repositories/userRepository");

// lấy hồ sơ người dùng
exports.getProfile = async (id) => {
  return await userRepository.findById(id);
};

// tìm người dùng theo tên đăng nhập
exports.findByLoginName = async (loginName) => {
  if (!loginName) {
    throw new Error("Login name is required");
  }
  return await userRepository.findByLoginName(loginName.trim());
};

// cập nhật hồ sơ
exports.updateProfile = async (id, data) => {
  return await userRepository.updateProfile(id, data);
};
