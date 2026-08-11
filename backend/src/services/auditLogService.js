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
  // ghi nhận sự kiện
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
