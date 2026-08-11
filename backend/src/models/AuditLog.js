const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true },
    resourceType: { type: String, default: null },
    resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    result: {
      type: String,
      enum: ["SUCCESS", "DENIED", "FAILED"],
      required: true,
    },
    details: { type: mongoose.Schema.Types.mixed, default: {} },
    ipAddress: { type: String, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
