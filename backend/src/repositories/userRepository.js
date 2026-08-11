const User = require("../models/User");

// lấy thông tin người dùng theo ID
exports.findById = (id) => {
  return User.findById(id);
};

// cập nhật thông tin người dùng
exports.updateProfile = (id, data) => {
  return User.findByIdAndUpdate(id, data, { new: true });
};
