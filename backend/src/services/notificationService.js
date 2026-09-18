const repository = require("../repositories/notificationRepository");

const ShareLink = require("../models/ShareLink");
const File = require("../models/File");
const Folder = require("../models/Folder");

const httpError = require("../utils/httpError");

const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const TRASH_WARNING_MS = 3 * 24 * 60 * 60 * 1000;

function safeId(value) {
  return value ? value.toString() : null;
}

async function createOnce(data) {
  try {
    return await repository.create(data);
  } catch (error) {
    if (error?.code === 11000 && data.dedupeKey) {
      return repository.findByDedupeKey(data.dedupeKey);
    }

    throw error;
  }
}

function formatRemainingTime(milliseconds) {
  const minutes = Math.max(1, Math.ceil(milliseconds / 60000));
  if (minutes < 60) {
    return `${minutes} phút`;
  }

  const hours = Math.ceil(minutes / 60);
  if (hours < 24) {
    return `${hours} giờ`;
  }
  return `${Math.ceil(hours / 24)} ngày`;
}

/*
 * =========================================================
 * TẠO THÔNG BÁO THÔNG THƯỜNG
 * =========================================================
 */
exports.create = async (data) => {
  if (!data?.user) {
    throw httpError("Notification user is required", 400);
  }

  return createOnce({
    ...data,
    dedupeKey:
      data.dedupeKey ||
      `${data.type}:${safeId(data.user)}:${Date.now()}:${Math.random()}`,
  });
};

/*
 * =========================================================
 * ACTIVITY LOG -> NOTIFICATION
 * =========================================================
 */
function getActivityMessage(activity) {
  const action = String(activity.action || "").toLowerCase();
  const resource =
    activity.resourceType === "folder"
      ? "thư mục"
      : activity.resourceType === "file"
        ? "file"
        : "tài nguyên";
  const details = activity.details || {};
  const name =
    details.name ||
    details.fileName ||
    details.folderName ||
    details.resourceName ||
    "";
  const actionLabels = {
    create: "đã tạo",
    create_file: "đã tạo file",
    create_folder: "đã tạo thư mục",
    upload: "đã tải lên",
    file_upload: "đã tải lên",
    download: "đã tải xuống",
    file_download: "đã tải xuống",
    preview: "đã xem trước",
    file_preview: "đã xem trước",
    rename: "đã đổi tên",
    file_rename: "đã đổi tên file",
    folder_rename: "đã đổi tên thư mục",
    move: "đã di chuyển",
    file_move: "đã di chuyển file",
    folder_move: "đã di chuyển thư mục",
    copy: "đã sao chép",
    file_copy: "đã sao chép file",
    folder_copy: "đã sao chép thư mục",
    delete: "đã chuyển vào thùng rác",
    file_delete: "đã chuyển file vào thùng rác",
    restore: "đã khôi phục",
    file_restore: "đã khôi phục file",
    permanent_delete: "đã xóa vĩnh viễn",
    file_permanent_delete: "đã xóa file vĩnh viễn",
    share: "đã tạo liên kết chia sẻ",
    share_link: "đã tạo liên kết chia sẻ",
    revoke_share: "đã thu hồi liên kết chia sẻ",
    grant_permission: "đã cấp quyền",
    update_permission: "đã cập nhật quyền",
    revoke_permission: "đã thu hồi quyền",
  };

  const actionText = actionLabels[action] || `đã thực hiện ${activity.action}`;
  if (name) {
    return `${actionText} ${resource} "${name}".`;
  }
  return `${actionText} ${resource}.`;
}

exports.createFromActivity = async (activity) => {
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

/*
 * =========================================================
 * SHARE LINK ĐƯỢC TẠO
 * =========================================================
 */
exports.createShareCreated = async ({ userId, share, resourceName }) => {
  const resourceLabel = share.resourceType === "folder" ? "thư mục" : "file";

  return createOnce({
    user: userId,
    type: "share_created",
    title: "Đã tạo liên kết chia sẻ",
    message:
      `Đã tạo liên kết chia sẻ cho ${resourceLabel} ` +
      `"${resourceName || "không tên"}".`,

    resourceType: "share",
    resourceId: share._id,
    metadata: {
      shareId: safeId(share._id),
      resourceId: safeId(share.resourceId),
      resourceType: share.resourceType,
      expiresAt: share.expiresAt,
    },
    dedupeKey: `share-created:${safeId(share._id)}`,
  });
};

/*
 * =========================================================
 * SHARE LINK SẮP HẾT HẠN
 * Điều kiện:
 * remaining <= 1/5 tổng thời gian
 * =========================================================
 */
async function syncShareExpiring(userId, now) {
  const shares = await ShareLink.find({
    owner: userId,
    isActive: true,
    expiresAt: {
      $ne: null,
      $gt: now,
    },
  }).select("_id resourceId resourceType createdAt expiresAt");

  for (const share of shares) {
    const createdAt = new Date(share.createdAt).getTime();
    const expiresAt = new Date(share.expiresAt).getTime();
    const total = expiresAt - createdAt;
    const remaining = expiresAt - now.getTime();
    if (total <= 0 || remaining <= 0 || remaining > total / 5) {
      continue;
    }

    let resourceName = "";

    if (share.resourceType === "file") {
      const file = await File.findById(share.resourceId).select("name");
      resourceName = file?.name || "file";
    } else {
      const folder = await Folder.findById(share.resourceId).select("name");
      resourceName = folder?.name || "thư mục";
    }

    await createOnce({
      user: userId,
      type: "share_expiring",
      title: "Liên kết sắp hết hạn",
      message:
        `Liên kết chia sẻ của ${
          share.resourceType === "folder" ? "thư mục" : "file"
        } "${resourceName}" ` +
        `sẽ hết hạn trong khoảng ` +
        `${formatRemainingTime(remaining)}.`,
      resourceType: "share",
      resourceId: share._id,
      metadata: {
        shareId: safeId(share._id),
        resourceId: safeId(share.resourceId),
        resourceType: share.resourceType,
        expiresAt: share.expiresAt,
        totalDurationMs: total,
        remainingMsAtCreation: remaining,
      },
      dedupeKey: `share-expiring:${safeId(share._id)}`,
    });
  }
}

/*
 * =========================================================
 * FILE / FOLDER TRONG THÙNG RÁC
 *
 * Cảnh báo khi còn <= 3 ngày.
 * =========================================================
 */
async function syncTrashExpiringForCollection(
  userId,
  collection,
  type,
  getDeletedAt,
) {
  for (const item of collection) {
    const deletedAt = getDeletedAt(item);
    if (!deletedAt) {
      continue;
    }

    const permanentAt = new Date(deletedAt).getTime() + TRASH_RETENTION_MS;
    const remaining = permanentAt - Date.now();
    if (remaining <= 0 || remaining > TRASH_WARNING_MS) {
      continue;
    }

    const resourceLabel = type === "folder" ? "thư mục" : "file";

    await createOnce({
      user: userId,
      type: "trash_expiring",
      title: "Sắp xóa vĩnh viễn",
      message:
        `${resourceLabel} "${item.name || "không tên"}" ` +
        `trong Thùng rác sẽ bị xóa vĩnh viễn ` +
        `trong khoảng ${formatRemainingTime(remaining)}.`,
      resourceType: type,
      resourceId: item._id,
      metadata: {
        deletedAt,
        permanentAt,
        retentionDays: 30,
      },
      dedupeKey:
        `trash-expiring:${type}:` +
        `${safeId(item._id)}:` +
        `${new Date(deletedAt).toISOString()}`,
    });
  }
}

/*
 * =========================================================
 * ĐỒNG BỘ CÁC THÔNG BÁO HỆ THỐNG
 * =========================================================
 */
exports.syncSystemNotifications = async (userId) => {
  const now = new Date();
  await syncShareExpiring(userId, now);
  const files = await File.find({
    owner: userId,
    isDeleted: true,
    deletedAt: {
      $ne: null,
    },
  }).select("_id name deletedAt");

  await syncTrashExpiringForCollection(
    userId,
    files,
    "file",
    (item) => item.deletedAt,
  );

  const folders = await Folder.find({
    owner: userId,
    isDeleted: true,
    deletedAt: {
      $ne: null,
    },
  }).select("_id name deletedAt");

  await syncTrashExpiringForCollection(
    userId,
    folders,
    "folder",
    (item) => item.deletedAt,
  );
};

/*
 * =========================================================
 * LẤY DANH SÁCH
 * =========================================================
 */
exports.list = async (userId, options = {}) => {
  await exports.syncSystemNotifications(userId);

  const parsedLimit = Number(options.limit ?? 50);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    throw httpError("Invalid limit", 400);
  }

  const safeLimit = Math.min(parsedLimit, 1000);
  const search = String(options.search || "").trim();

  let from = null;
  let to = null;

  if (options.from) {
    from = new Date(options.from);
    if (Number.isNaN(from.getTime())) {
      throw httpError("Invalid from date", 400);
    }
  }
  if (options.to) {
    to = new Date(options.to);
    if (Number.isNaN(to.getTime())) {
      throw httpError("Invalid to date", 400);
    }
    to.setHours(23, 59, 59, 999);
  }
  if (from && to && from > to) {
    throw httpError("From date must be before to date", 400);
  }

  const [notifications, unreadCount] = await Promise.all([
    repository.findByUser(userId, {
      limit: safeLimit,
      search,
      from,
      to,
    }),
    repository.countUnreadByUser(userId),
  ]);
  return { notifications, unreadCount };
};

/*
 * =========================================================
 * ĐỌC MỘT THÔNG BÁO
 * =========================================================
 */
exports.markRead = async (userId, notificationId) => {
  const notification = await repository.markRead(notificationId, userId);
  if (!notification) {
    throw httpError("Notification not found", 404);
  }

  return notification;
};

/*
 * =========================================================
 * ĐỌC TẤT CẢ
 * =========================================================
 */
exports.markAllRead = async (userId) => {
  await repository.markAllRead(userId);

  return { message: "All notifications marked as read" };
};
