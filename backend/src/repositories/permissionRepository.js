const Permission = require("../models/Permission");

// tìm permission trực tiếp
exports.findDirect = (userId, resourceId) => {
  return Permission.findOne({ user: userId, resourceId: resourceId });
};

// tạo permission
exports.create = (data) => {
  return Permission.create(data);
};

// cập nhật permission
exports.update = (id, permissions) => {
  return Permission.findByIdAndUpdate(id, { permissions }, { new: true });
};

// thu hồi permission
exports.remove = (id) => {
  return Permission.findByIdAndDelete(id);
};
