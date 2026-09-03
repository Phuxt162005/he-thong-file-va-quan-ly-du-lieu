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
    .populate("user", "username email avatar")
    .sort({ createdAt: -1 });
};

// tạo permission
exports.create = (data) => {
  return Permission.create(data);
};

// cập nhật permission
exports.update = (id, permissions) => {
  return Permission.findByIdAndUpdate(
    id,
    { $set: { permissions } },
    { new: true, runValidators: true },
  );
};

// thu hồi permission
exports.remove = (id) => {
  return Permission.findByIdAndDelete(id);
};

exports.removeByResource = (resourceId, resourceType) => {
  return Permission.deleteMany({
    resourceId,
    resourceType,
  });
};
