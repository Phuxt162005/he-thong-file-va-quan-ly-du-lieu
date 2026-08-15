const User = require("../models/User");

// lấy thông tin người dùng theo ID
exports.findById = (id) => {
  return User.findById(id);
};

// tìm người dùng theo tên đăng nhập
exports.findByLoginName = (loginName) => {
  return User.findOne({ login_name: loginName }).select(
    "_id login_name first_name last_name",
  );
};

// cập nhật thông tin người dùng
exports.updateProfile = (id, data) => {
  return User.findByIdAndUpdate(id, data, { new: true });
};
