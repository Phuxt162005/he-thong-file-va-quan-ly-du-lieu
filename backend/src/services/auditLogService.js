const repository = require("../repositories/auditLogRepository");

exports.log = async ({
  userId = null,
  action,
  resourceType = null,
  resourceId = null,
  result,
  details = {},
  ipAddress = null,
}) => {
  return await repository.create({
    user: userId,
    action,
    resourceType,
    resourceId,
    result,
    details,
    ipAddress,
  });
};

exports.getDeniedLogs = async () => {
  return await repository.findDenied();
};
