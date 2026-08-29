const User = require("../models/User");

// lấy thông tin người dùng theo ID
exports.findById = async (userId) => {
  return await User.findById(userId).select("-password");
};

// tìm người dùng theo tên đăng nhập
exports.findByLoginName = async (username) => {
  if (!username) {
    throw new Error("Username is required");
  }

  return await User.findOne({ username: username.trim() }).select("-password");
};

// cập nhật thông tin người dùng
exports.updateProfile = (id, data) => {
  return User.findByIdAndUpdate(id, data, { new: true });
};
