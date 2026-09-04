const service = require("../services/folderService");
const asyncHandler = require("../middleware/asyncHandler");

// tạo thư mục
exports.create = asyncHandler(async (req, res) => {
  const folder = await service.createFolder(req.user.id, req.body);

  return res.status(201).json(folder);
});

// lấy thư mục con
exports.children = asyncHandler(async (req, res) => {
  const folders = await service.getChildren(req.user.id, req.params.id);

  return res.json(folders);
});

// đổi tên
exports.rename = asyncHandler(async (req, res) => {
  const folder = await service.renameFolder(
    req.user.id,
    req.params.id,
    req.body.name,
  );

  if (!folder) {
    return res.status(404).json({ message: "Folder not found" });
  }

  return res.json(folder);
});

// xóa
exports.remove = asyncHandler(async (req, res) => {
  const folder = await service.deleteFolder(req.user.id, req.params.id);

  if (!folder) {
    return res.status(404).json({ message: "Folder not found" });
  }

  return res.json({ message: "Folder deleted successfully", folder });
});

// di chuyển Folder
exports.move = asyncHandler(async (req, res) => {
  const folder = await service.moveFolder(
    req.user.id,
    req.params.id,
    req.body.parentFolder,
  );
  if (!folder) {
    return res.status(404).json({ message: "Folder not found" });
  }

  return res.json(folder);
});

// lấy thông tin Folder
exports.get = asyncHandler(async (req, res) => {
  const folder = await service.getFolder(req.user.id, req.params.id);
  if (!folder) {
    return res.status(404).json({ message: "Folder not found" });
  }

  return res.json(folder);
});

exports.list = asyncHandler(async (req, res) => {
  const parentFolder = req.query.parentFolder || null;
  const folders = await service.getFolders(req.user.id, parentFolder);

  return res.json(folders);
});

exports.restore = asyncHandler(async (req, res) => {
  const folder = await service.restoreFolder(req.user.id, req.params.id);

  return res.json({
    message: "Folder restored successfully",
    folder,
  });
});

exports.getTrash = asyncHandler(async (req, res) => {
  const folders = await service.getDeletedFolders(req.user.id);
  return res.json({ folders });
});

exports.permanentDelete = asyncHandler(async (req, res) => {
  const result = await service.permanentDeleteFolder(
    req.user.id,
    req.params.id,
  );

  return res.json({ message: "Folder permanently deleted", result });
});

exports.copy = asyncHandler(async (req, res) => {
  const { destinationFolderId } = req.body;
  const result = await service.copyFolder(
    req.user.id,
    req.params.id,
    destinationFolderId || null,
  );

  return res
    .status(201)
    .json({ message: "Folder copied successfully", result });
});
