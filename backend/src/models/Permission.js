const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    resourceType: { type: String, enum: ["file", "folder"], required: true },
    permissions: [
      {
        type: String,
        enum: [
          "read",
          "write",
          "download",
          "delete",
          "share",
          "permission_management",
        ],
      },
    ],
    inherited: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// 1 user chỉ có 1 permission trên cùng resource
permissionSchema.index(
  { user: 1, resourceId: 1, resourceType: 1 },
  { unique: true },
);

module.exports = mongoose.model("Permission", permissionSchema);
