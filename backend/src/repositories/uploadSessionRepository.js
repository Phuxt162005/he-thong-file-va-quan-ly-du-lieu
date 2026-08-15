const UploadSession = require("../models/UploadSession");

exports.create = (data) => {
  return UploadSession.create(data);
};

exports.findById = (uploadId) => {
  return UploadSession.findById(uploadId);
};

exports.addReceivedChunk = async (uploadId, chunkIndex) => {
  return UploadSession.findByIdAndUpdate(
    uploadId,
    { $addToSet: { receivedChunks: chunkIndex } },
    { new: true },
  );
};

exports.markCompleted = (uploadId) => {
  return UploadSession.findByIdAndUpdate(
    uploadId,
    { status: "completed" },
    { new: true },
  );
};

exports.markFailed = (uploadId) => {
  return UploadSession.findByIdAndUpdate(
    uploadId,
    { status: "failed" },
    { new: true },
  );
};

exports.delete = (uploadId) => {
  return UploadSession.findByIdAndDelete(uploadId);
};

exports.findExpired = () => {
  return UploadSession.find({
    expiresAt: { $lt: new Date() },
    status: "uploading",
  });
};

exports.markExpired = (uploadId) => {
  return UploadSession.findByIdAndUpdate(
    uploadId,
    { status: "expired" },
    { new: true },
  );
};
