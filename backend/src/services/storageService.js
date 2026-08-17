const fs = require("fs");
const path = require("path");

const STORAGE_ROOT = path.join(process.cwd(), "storage", "files");

// tạo thư mục Storage
exports.ensureStorageDirectory = () => {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
  return STORAGE_ROOT;
};

// lấy đường dẫn của File
exports.getFilePath = (storageName) => {
  if (!storageName) {
    throw new Error("Storage name is required");
  }
  return path.join(STORAGE_ROOT, storageName);
};

// kiểm tra File có tồn tại
exports.fileExists = (storageName) => {
  const filePath = exports.getFilePath(storageName);

  return fs.existsSync(filePath);
};

// lấy thông tin File
exports.getFileInfo = (storageName) => {
  const filePath = exports.getFilePath(storageName);

  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.statSync(filePath);
};

// xóa File vật lý
exports.deleteFile = (storageName) => {
  const filePath = exports.getFilePath(storageName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// lấy đường dẫn để download
exports.getDownloadPath = (storageName) => {
  const filePath = exports.getFilePath(storageName);

  if (!fs.existsSync(filePath)) {
    throw new Error("Physical file not found");
  }
  return filePath;
};
