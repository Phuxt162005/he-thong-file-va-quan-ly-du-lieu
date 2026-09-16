const Notification = require("../models/Notification");

exports.create = (data) => {
  return Notification.create(data);
};

exports.findByUser = (userId, limit = 50) => {
  return Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
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
