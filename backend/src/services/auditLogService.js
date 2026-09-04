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

exports.getDeniedLogs = async (limit = 100) => {
  const parsedLimit = Number(limit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    throw new Error("Invalid limit");
  }
  return await repository.findDenied(Math.min(parsedLimit, 100));
};
