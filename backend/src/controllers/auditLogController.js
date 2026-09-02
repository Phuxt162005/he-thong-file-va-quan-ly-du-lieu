const auditLogService = require("../services/auditLogService");

exports.getDeniedLogs = async (req, res) => {
  const logs = await auditLogService.getDeniedLogs();

  return res.json(logs);
};
