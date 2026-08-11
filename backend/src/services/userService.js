const userRepository = require("../repositories/userRepository");

// lấy hồ sơ người dùng
exports.getProfile = async (id) => {
  return await userRepository.findById(id);
};

// cập nhật hồ sơ
exports.updateProfile = async (id, data) => {
  return await userRepository.updateProfile(id, data);
};
