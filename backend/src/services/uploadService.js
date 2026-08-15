const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const uploadRepository = require("../repositories/uploadSessionRepository");
const chunkStorage = require("./chunkStorageService");
const fileService = require("./fileService");

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;
const SESSION_EXPIRE_MS = 24 * 60 * 60 * 1000;

exports.initiateUpload = async (
  userId,
  { fileName, mimeType, fileSize, folderId, chunkSize = DEFAULT_CHUNK_SIZE },
) => {
  if (!fileName) {
    throw new Error("File name is required");
  }
  if (!fileSize || fileSize <= 0) {
    throw new Error("File size is invalid");
  }

  const totalChunks = Math.ceil(fileSize / chunkSize);
  const session = await uploadRepository.create({
    user: userId,
    folder: folderId || null,
    fileName,
    mimeType: mimeType || "application/octet-stream",
    fileSize,
    chunkSize,
    totalChunks,
    expiresAt: new Date(Date.now() + SESSION_EXPIRE_MS),
  });
  chunkStorage.ensureUploadDirectory(session._id);

  return {
    uploadId: session._id,
    chunkSize: session.chunkSize,
    totalChunks: session.totalChunks,
    expiresAt: session.expiresAt,
  };
};

exports.uploadChunk = async (uploadId, chunkIndex, buffer, checksum) => {
  const session = await uploadRepository.findById(uploadId);

  if (!session) {
    throw new Error("Upload session not found");
  }
  if (session.status !== "uploading") {
    throw new Error("Upload session is not active");
  }
  if (new Date() > session.expiresAt) {
    await uploadRepository.markFailed(uploadId);
    throw new Error("Upload session expired");
  }
  if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
    throw new Error("Invalid chunk index");
  }
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("Chunk is empty");
  }

  // kiểm tra checksum nếu Client gửi
  if (checksum) {
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    if (hash !== checksum) {
      throw new Error("Chunk checksum mismatch");
    }
  }
  chunkStorage.writeChunk(uploadId, chunkIndex, buffer);

  const updated = await uploadRepository.addReceivedChunk(uploadId, chunkIndex);

  return {
    uploadId,
    chunkIndex,
    receivedChunks: updated.receivedChunks,
    totalChunks: updated.totalChunks,
  };
};

exports.getUploadStatus = async (uploadId) => {
  const session = await uploadRepository.findById(uploadId);

  if (!session) {
    throw new Error("Upload session not found");
  }

  const receivedChunks = chunkStorage.getReceivedChunks(
    uploadId,
    session.totalChunks,
  );
  const missingChunks = [];

  for (let i = 0; i < session.totalChunks; i++) {
    if (!receivedChunks.includes(i)) {
      missingChunks.push(i);
    }
  }

  return {
    uploadId,
    status: session.status,
    fileName: session.fileName,
    fileSize: session.fileSize,
    chunkSize: session.chunkSize,
    totalChunks: session.totalChunks,
    receivedChunks,
    missingChunks,
    expiresAt: session.expiresAt,
  };
};

exports.completeUpload = async (uploadId, userId) => {
  const session = await uploadRepository.findById(uploadId);

  if (!session) {
    throw new Error("Upload session not found");
  }
  if (session.user.toString() !== userId.toString()) {
    throw new Error("You do not own this upload");
  }

  const receivedChunks = chunkStorage.getReceivedChunks(
    uploadId,
    session.totalChunks,
  );

  if (receivedChunks.length !== session.totalChunks) {
    throw new Error("Not all chunks have been uploaded");
  }
  const storageDirectory = path.join(process.cwd(), "storage", "files");

  fs.mkdirSync(storageDirectory, {
    recursive: true,
  });

  const storageName = `${crypto.randomUUID()}-${session.fileName}`;
  const outputPath = path.join(storageDirectory, storageName);

  try {
    chunkStorage.mergeChunks(uploadId, session.totalChunks, outputPath);
    const stats = fs.statSync(outputPath);
    if (stats.size !== session.fileSize) {
      fs.unlinkSync(outputPath);
      throw new Error("Merged file size mismatch");
    }

    const file = await fileService.createFile(userId, session.folder, {
      originalname: session.fileName,
      filename: storageName,
      mimeType: session.mimeType,
      size: stats.size,
    });
    await uploadRepository.markCompleted(uploadId);
    chunkStorage.deleteUploadDirectory(uploadId);

    return file;
  } catch (error) {
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    await uploadRepository.markFailed(uploadId);
    throw error;
  }
};
