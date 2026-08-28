const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    resourceType: {
      type: String,
      enum: ["file", "folder", "share", "permissions", "user"],
      default: null,
    },
    resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

activityLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
