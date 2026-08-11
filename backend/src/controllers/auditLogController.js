const auditLogService = require("../services/auditLogService");

exports.getDeniedLogs = async (req, res) => {
  // chỉ tài khoản có quyền quản trị mới được gọi API
  const logs = await auditLogService.getDeniedLogs();

  return res.json(logs);
};
