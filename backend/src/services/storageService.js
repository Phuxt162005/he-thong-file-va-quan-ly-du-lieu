const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const STORAGE_ROOT = path.join(process.cwd(), "storage", "files");

// tạo thư mục Storage
exports.ensureStorageDirectory = () => {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
  return STORAGE_ROOT;
};

// tạo tên Storage duy nhất
exports.generateStorageName = (fileName) => {
  if (typeof fileName !== "string" || !fileName.trim()) {
    throw new Error("File name is required");
  }

  const originalName = path.basename(fileName.trim());
  const extension = path.extname(originalName);
  if (extension.length > 20) {
    throw new Error("Invalid file extension");
  }

  return `${crypto.randomUUID()}${extension}`;
};

// lấy đường dẫn vật lý của File
exports.getFilePath = (storageName) => {
  if (!storageName) {
    throw new Error("Storage name is required");
  }

  const filePath = path.resolve(STORAGE_ROOT, storageName);
  const storageRoot = path.resolve(STORAGE_ROOT);
  if (
    filePath !== storageRoot &&
    !filePath.startsWith(storageRoot + path.sep)
  ) {
    throw new Error("Invalid storage path");
  }
  return filePath;
};

// kiểm tra File tồn tại
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

// lấy đường dẫn Download
exports.getDownloadPath = (storageName) => {
  const filePath = exports.getFilePath(storageName);

  if (!fs.existsSync(filePath)) {
    throw new Error("Physical file not found");
  }
  return filePath;
};

// xóa File vật lý
exports.deleteFile = (storageName) => {
  const filePath = exports.getFilePath(storageName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// lưu file
exports.saveFile = (buffer, originalName) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Invalid file buffer");
  }

  exports.ensureStorageDirectory();
  const storageName = exports.generateStorageName(originalName);
  const filePath = exports.getFilePath(storageName);
  fs.writeFileSync(filePath, buffer);

  return { storageName, filePath };
};

// sao chép File vật lý
exports.copyFile = (sourceStorageName, targetOriginalName) => {
  const sourcePath = exports.getFilePath(sourceStorageName);
  if (!fs.existsSync(sourcePath)) {
    throw new Error("Physical file not found");
  }

  exports.ensureStorageDirectory();
  const targetStorageName = exports.generateStorageName(targetOriginalName);
  const targetPath = exports.getFilePath(targetStorageName);
  fs.copyFileSync(sourcePath, targetPath);

  return { storageName: targetStorageName, filePath: targetPath };
};
