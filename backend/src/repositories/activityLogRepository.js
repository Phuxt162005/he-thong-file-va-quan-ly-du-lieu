const activityLog = require("../models/ActivityLog");

// tạo bản ghi activity log
exports.create = (data) => {
  return ActivityLog.create(data);
};

// lấy lịch sử hoạt động của User
exports.findByUser = (userId) => {
  return ActivityLog.find({ user: userId }).sort({ createdAt: -1 });
};
