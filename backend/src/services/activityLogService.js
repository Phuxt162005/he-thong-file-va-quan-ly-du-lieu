const repository = require("../repositories/activityLogRepository");

exports.log = async (
  userId,
  action,
  resourceType = null,
  resourceId = null,
  details = {},
) => {
  // ghi nhận thao tác của người dùng
  return await repository.create({
    user: userId,
    action,
    resourceType,
    resourceId,
    details,
  });
};

// lấy lịch sử hoạt động mới nhất
exports.getUserActivities = async (userId, limit = 100) => {
  const parsedLimit = Number(limit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    throw new Error("Invalid limit");
  }

  return await repository.findByUser(userId, Math.min(parsedLimit, 100));
};
