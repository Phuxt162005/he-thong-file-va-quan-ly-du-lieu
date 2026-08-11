const AuditLog = require("../models/AuditLog");

// tạo audit log
exports.create = (data) => {
  return AuditLog.create(data);
};

// tìm log theo user
exports.findByUser = (userId) => {
  return AuditLog.find({ user: userId }).sort({ createdAt: -1 });
};

// lấy các sự kiện bị từ chối
exports.findDenied = () => {
  return AuditLog.find({ result: "DENIED" }).sort({ createdAt: -1 });
};
