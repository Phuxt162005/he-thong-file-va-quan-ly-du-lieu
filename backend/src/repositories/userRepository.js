const User = require("../models/User");

// lấy thông tin người dùng theo ID
exports.findById = (id) => {
  return User.findById(id);
};

// tìm người dùng theo tên đăng nhập
exports.findByLoginName = async (username) => {
  if (!username) {
    throw new Error("Username is required");
  }
  return await userRepository.findByLoginName(username.trim());
};

// cập nhật thông tin người dùng
exports.updateProfile = (id, data) => {
  return User.findByIdAndUpdate(id, data, { new: true });
};
