const fileService = require("../services/fileService");
const storageService = require("../services/storageService");
const asyncHandler = require("../middleware/asyncHandler");

// lấy file
exports.getFile = asyncHandler(async (req, res) => {
  const file = await fileService.getFile(req.user.id, req.params.id);
  if (!file) {
    return res.status(404).json({
      message: "File not found",
    });
  }

  return res.json(file);
});

// xóa file
exports.deleteFile = asyncHandler(async (req, res) => {
  const file = await fileService.deleteFile(req.user.id, req.params.id);
  if (!file) {
    return res.status(404).json({ message: "File not found" });
  }

  return res.json({
    message: "File deleted successfully",
    file,
  });
});

// upload file
exports.upload = asyncHandler(async (req, res) => {
  let stored = null;

  if (!req.file) {
    return res.status(400).json({ message: "File is required" });
  }

  const folderId = req.body.folderId || null;
  await fileService.checkUploadPermission(req.user.id, folderId);
  stored = storageService.saveFile(req.file.buffer, req.file.originalname);

  const file = await fileService.createFile(req.user.id, folderId, {
    originalname: req.file.originalname,
    filename: stored.storageName,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });

  return res.status(201).json({ message: "Upload successfully", file });
});

// download
exports.download = asyncHandler(async (req, res) => {
  const result = await fileService.downloadFile(req.user.id, req.params.id);
  if (!result) {
    return res.status(404).json({ message: "File not found" });
  }

  return res.download(result.filePath, result.file.name);
});

// preview
exports.preview = asyncHandler(async (req, res) => {
  const result = await fileService.previewFile(req.user.id, req.params.id);
  if (!result) {
    return res.status(404).json({ message: "File not found" });
  }

  res.setHeader(
    "Content-Type",
    result.file.mimeType || "application/octet-stream",
  );
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(result.file.name)}"`,
  );

  return res.sendFile(result.filePath);
});

// restore
exports.restore = asyncHandler(async (req, res) => {
  const file = await fileService.restoreFile(req.user.id, req.params.id);

  return res.json({
    message: "File restored successfully",
    file,
  });
});

exports.getTrash = asyncHandler(async (req, res) => {
  const files = await fileService.getDeletedFiles(req.user.id);
  return res.json({
    files,
  });
});

// xóa vĩnh viễn File
exports.permanentDelete = asyncHandler(async (req, res) => {
  const file = await fileService.permanentDeleteFile(
    req.user.id,
    req.params.id,
  );

  return res.json({ message: "File permanently deleted", file });
});

exports.rename = asyncHandler(async (req, res) => {
  const file = await fileService.renameFile(
    req.user.id,
    req.params.id,
    req.body.name,
  );

  return res.json({ message: "File renamed successfully", file });
});

// copy file
exports.copy = asyncHandler(async (req, res) => {
  const file = await fileService.copyFile(
    req.user.id,
    req.params.id,
    req.body.destinationFolderId || null,
  );

  return res.status(201).json({ message: "File copied successfully", file });
});

exports.getFilesByFolder = asyncHandler(async (req, res) => {
  const folderId = req.query.folderId || null;
  const files = await fileService.getFilesByFolder(req.user.id, folderId);

  return res.json({ files });
});
