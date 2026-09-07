const mongoose = require("mongoose");

const shareLinkSchema = new mongoose.Schema(
  {
    resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    resourceType: { type: String, enum: ["file", "folder"], required: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: { type: String, required: true, unique: true },
    password: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    maxDownloads: { type: Number, default: null },
    downloadCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    accessType: {
      type: String,
      enum: ["view", "download"],
      default: "download",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ShareLink", shareLinkSchema);
