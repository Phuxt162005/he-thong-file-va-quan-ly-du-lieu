const mongoose = require("mongoose");

const uploadSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    chunkSize: { type: Number, required: true },
    totalChunks: { type: Number, required: true },
    receivedChunks: { type: [Number], default: [] },
    status: {
      type: String,
      enum: ["uploading", "completed", "failed", "expired"],
      default: "uploading",
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

uploadSessionSchema.index({ expiresAt: 1, status: 1 });

module.exports = mongoose.model("UploadSession", uploadSessionSchema);
