const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "share_created",
        "share_expiring",
        "trash_expiring",
        "activity",
        "profile_updated",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxLength: 1000,
    },
    resourceType: {
      type: String,
      enum: ["file", "folder", "share", "user", null],
      default: null,
    },
    resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ActivityLog",
      default: null,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    dedupeKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
