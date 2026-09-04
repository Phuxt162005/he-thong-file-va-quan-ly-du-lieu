const service = require("../services/folderService");
const asyncHandler = require("../middleware/asyncHandler");

// tạo thư mục
exports.create = asyncHandler(async (req, res) => {
  try {
    const folder = await service.createFolder(req.user.id, req.body);

    return res.status(201).json(folder);
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
});

// lấy thư mục con
exports.children = asyncHandler(async (req, res) => {
  try {
    const folders = await service.getChildren(req.user.id, req.params.id);

    return res.json(folders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// đổi tên
exports.rename = asyncHandler(async (req, res) => {
  try {
    const folder = await service.renameFolder(
      req.user.id,
      req.params.id,
      req.body.name,
    );

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    return res.json(folder);
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
});

// xóa
exports.remove = asyncHandler(async (req, res) => {
  try {
    const folder = await service.deleteFolder(req.user.id, req.params.id);

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    return res.json({ message: "Folder deleted successfully", folder });
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
});

// di chuyển Folder
exports.move = asyncHandler(async (req, res) => {
  try {
    const folder = await service.moveFolder(
      req.user.id,
      req.params.id,
      req.body.parentFolder,
    );
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    return res.json(folder);
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
});

// lấy thông tin Folder
exports.get = asyncHandler(async (req, res) => {
  try {
    const folder = await service.getFolder(req.user.id, req.params.id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    return res.json(folder);
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
});

exports.list = asyncHandler(async (req, res) => {
  try {
    const parentFolder = req.query.parentFolder || null;
    const folders = await service.getFolders(req.user.id, parentFolder);

    return res.json(folders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

exports.restore = asyncHandler(async (req, res) => {
  try {
    const folder = await service.restoreFolder(req.user.id, req.params.id);

    return res.json({
      message: "Folder restored successfully",
      folder,
    });
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
});

exports.getTrash = asyncHandler(async (req, res) => {
  try {
    const folders = await service.getDeletedFolders(req.user.id);
    return res.json({ folders });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

exports.permanentDelete = asyncHandler(async (req, res) => {
  try {
    const result = await service.permanentDeleteFolder(
      req.user.id,
      req.params.id,
    );

    return res.json({ message: "Folder permanently deleted", result });
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
});

exports.copy = asyncHandler(async (req, res) => {
  try {
    const { destinationFolderId } = req.body;
    const result = await service.copyFolder(
      req.user.id,
      req.params.id,
      destinationFolderId || null,
    );

    return res
      .status(201)
      .json({ message: "Folder copied successfully", result });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});
