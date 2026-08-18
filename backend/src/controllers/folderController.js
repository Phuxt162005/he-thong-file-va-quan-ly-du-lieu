const service = require("../services/folderService");

// tạo thư mục
exports.create = async (req, res) => {
  try {
    const folder = await service.createFolder(req.user.id, req.body);

    return res.status(201).json(folder);
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};

// lấy thư mục con
exports.children = async (req, res) => {
  try {
    const folders = await service.getChildren(req.user.id, req.params.id);

    return res.json(folders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// đổi tên
exports.rename = async (req, res) => {
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
};

// xóa
exports.remove = async (req, res) => {
  try {
    const folder = await service.deleteFolder(req.user.id, req.params.id);

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    return res.json({ message: "Folder deleted successfully", folder });
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};

// di chuyển Folder
exports.move = async (req, res) => {
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
};
