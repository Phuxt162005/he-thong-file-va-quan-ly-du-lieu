const repository = require("../repositories/activityLogRepository");
const notificationService = require("./notificationService");

exports.log = async (
  userId,
  action,
  resourceType = null,
  resourceId = null,
  details = {},
) => {
  const activity = await repository.create({
    user: userId,
    action,
    resourceType,
    resourceId,
    details,
  });

  await notificationService.createFromActivity(activity);
  return activity;
};

exports.getUserActivities = async (userId, limit = 100) => {
  const parsedLimit = Number(limit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    throw new Error("Invalid limit");
  }

  return await repository.findByUser(userId, Math.min(parsedLimit, 100));
};
