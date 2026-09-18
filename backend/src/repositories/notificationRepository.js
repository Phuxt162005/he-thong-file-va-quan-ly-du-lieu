const Notification = require("../models/Notification");

exports.create = (data) => {
  return Notification.create(data);
};

exports.findByUser = (
  userId,
  { limit = 50, search = "", from = null, to = null } = {},
) => {
  const query = {
    user: userId,
  };
  const keyword = String(search || "").trim();

  if (keyword) {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedKeyword, "i");
    query.$or = [{ title: regex }, { message: regex }];
  }

  if (from || to) {
    query.createdAt = {};
    if (from) {
      query.createdAt.$gte = new Date(from);
    }
    if (to) {
      query.createdAt.$lte = new Date(to);
    }
  }
  return Notification.find(query).sort({ createdAt: -1 }).limit(limit);
};

exports.countUnreadByUser = (userId) => {
  return Notification.countDocuments({ user: userId, readAt: null });
};

exports.markRead = (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      user: userId,
      readAt: null,
    },
    { $set: { readAt: new Date() } },
    { new: true },
  );
};

exports.markAllRead = (userId) => {
  return Notification.updateMany(
    { user: userId, readAt: null },
    { $set: { readAt: new Date() } },
  );
};

exports.findByDedupeKey = (dedupeKey) => {
  return Notification.findOne({
    dedupeKey,
  });
};
