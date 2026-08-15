const fileService = require("../services/fileService");

// lấy file
exports.getFile = async (req, res) => {
  const file = await fileService.getFile(req.params.id);
  if (!file) {
    return res.status(404).json({ message: "File not found" });
  }

  return res.json(file);
};

// xóa file
exports.deleteFile = async (req, res) => {
  // permission được kiểm tra trước khi gọi service
  const file = await fileService.deleteFile(req.user.id, req.params.id);

  return res.json({ message: "File deleted successfully", file });
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
