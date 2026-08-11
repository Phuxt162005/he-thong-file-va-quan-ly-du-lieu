const mongoose = require("mongoose");
const folderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parentFolder: {
      type: mongoose.Schema.Types.ObjectIdm,
      ref: "Folder",
      default: null,
    },
    path: { type: String, default: "/" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Folder", folderSchema);
