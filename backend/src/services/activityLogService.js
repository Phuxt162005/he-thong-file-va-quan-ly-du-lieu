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

exports.createFromActivity = async (activity) => {
  const notificationActions = new Set([
    "create",
    "create_file",
    "create_folder",
    "upload",
    "file_upload",
    "rename",
    "file_rename",
    "folder_rename",
    "move",
    "file_move",
    "folder_move",
    "delete",
    "file_delete",
    "restore",
    "file_restore",
    "permanent_delete",
    "file_permanent_delete",
    "share",
    "share_link",
    "revoke_share",
    "grant_permission",
    "update_permission",
    "revoke_permission",
  ]);

  if (!notificationActions.has(String(activity.action || "").toLowerCase())) {
    return null;
  }
  if (!activity?.user) {
    return null;
  }
  const resourceType =
    activity.resourceType === "file" || activity.resourceType === "folder"
      ? activity.resourceType
      : null;

  return createOnce({
    user: activity.user,
    type: "activity",
    title: "Lịch sử hoạt động",
    message: getActivityMessage(activity),
    resourceType,
    resourceId: activity.resourceId || null,
    activityId: activity._id,
    metadata: {
      action: activity.action,
      resourceType: activity.resourceType,
    },
    dedupeKey: `activity:${safeId(activity._id)}`,
  });
};
