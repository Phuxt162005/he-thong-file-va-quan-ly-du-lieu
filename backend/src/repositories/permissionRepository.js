const Permission = require("../models/Permission");

// tìm permission trực tiếp
exports.findDirect = (userId, resourceId, resourceType) => {
  return Permission.findOne({
    user: userId,
    resourceId,
    resourceType,
  });
};

// lấy toàn bộ permission của resource
exports.findByResource = (resourceId, resourceType) => {
  return Permission.find({ resourceId, resourceType })
    .populate("user", "login_name first_name last_name")
    .sort({ createdAt: -1 });
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
