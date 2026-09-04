const service = require("../services/activityLogService");

exports.getMyActivities = async (req, res) => {
  try {
    const logs = await service.getUserActivities(req.user.id, req.query.limit);

    return res.json(logs);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
