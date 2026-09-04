const auditLogService = require("../services/auditLogService");

exports.getDeniedLogs = async (req, res) => {
  try {
    const logs = await auditLogService.getDeniedLogs(req.query.limit);

    return res.json(logs);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
