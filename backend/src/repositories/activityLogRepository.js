const activityLog = require("../models/ActivityLog");

// tạo bản ghi activity log
exports.create = (data) => {
  return activityLog.create(data);
};

// lấy lịch sử hoạt động của User
exports.findByUser = (userId) => {
  return activityLog.find({ user: userId }).sort({ createdAt: -1 });
};
