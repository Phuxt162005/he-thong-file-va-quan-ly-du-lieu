const fileService = require("../services/fileService");

// lấy file
exports.getFile = async (req, res) => {
  try {
    const file = await fileService.getFile(req.user.id, req.params.id);
    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    return res.json(file);
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};

// xóa file
exports.deleteFile = async (req, res) => {
  try {
    const file = await fileService.deleteFile(req.user.id, req.params.id);
    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    return res.json({
      message: "File deleted successfully",
      file,
    });
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};

// upload file
exports.upload = async (req, res) => {
  // req.file chứa thông file đã được Storage xử lý
  if (!req.file) {
    return res.status(400).json({ message: "File is required" });
  }

  const file = await fileService.createFile(
    req.user.id,
    req.body.folderId || null,
    req.file,
  );

  return res.status(201).json({ message: "Upload successfully", file });
};

// download
exports.download = async (req, res) => {
  try {
    const result = await fileService.downloadFile(req.user.id, req.params.id);
    if (!result) {
      return res.status(404).json({ message: "File not found" });
    }

    return res.download(result.filePath, result.file.name);
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};
