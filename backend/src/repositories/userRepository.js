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
// cập nhật thông tin người dùng
exports.updateProfile = (id, data) => {
  const allowedData = {};

  if (data.username !== undefined) {
    allowedData.username = data.username;
  }
  if (data.email !== undefined) {
    allowedData.email = data.email;
  }
  if (data.firstName !== undefined) {
    allowedData.firstName = data.firstName;
  }
  if (data.lastName !== undefined) {
    allowedData.lastName = data.lastName;
  }
  if (data.avatar !== undefined) {
    allowedData.avatar = data.avatar;
  }

  return User.findByIdAndUpdate(
    id,
    { $set: allowedData },
    { new: true, runValidators: true },
  ).select("-password");
};

exports.findByIdWithPassword = (userId) => {
  return User.findById(userId).select("+password");
};

exports.updatePassword = (userId, password) => {
  return User.findByIdAndUpdate(
    userId,
    { $set: { password } },
    { new: true, runValidators: true },
  ).select("-password");
};

// xóa tài khoản
exports.deleteById = (id) => {
  return User.findByIdAndDelete(id);
};
