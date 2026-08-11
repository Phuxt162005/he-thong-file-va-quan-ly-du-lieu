const service = require("../services/activityLogService");

exports.getMyActivities = async (req, res) => {
  // lấy lịch sử của tài khoản hiện tại
  const logs = await service.getUserActivities(req.user.id);
  return res.json(logs);
};
