const fileRepository = require("../repositories/fileRepository");
const activityLogService = require("./activityLogService");
const permissionService = require("./permissionService");
const storageService = require("./storageService");

exports.createFile = async (userId, folderId, fileData) => {
  // metadata chỉ được tạo sau khi Storage xử lý file thành công
  return await fileRepository.create({
    name: fileData.originalname,
    owner: userId,
    folder: folderId,
    storageName: fileData.filename,
    mimeType: fileData.mimeType,
    size: fileData.size,
  });
};

exports.getFile = async (userId, fileId) => {
  const file = await fileRepository.findById(fileId);
  if (!file) {
    return null;
  }

  // Owner luôn được truy cập
  const owner = await permissionService.isOwner(userId, fileId, "file");
  if (owner) {
    return file;
  }

  // kiểm tra quyền read
  const permissions = await permissionService.resolvePermission(
    userId,
    fileId,
    "file",
  );

  if (!permissions.includes("read")) {
    throw new Error("You do not have permission to read this file");
  }
  return file;
};

exports.deleteFile = async (userId, fileId) => {
  const file = await fileRepository.findById(fileId);
  if (!file) {
    return null;
  }

  // Owner luôn được xóa
  const owner = await permissionService.isOwner(userId, fileId, "file");
  if (!owner) {
    const permissions = await permissionService.resolvePermission(
      userId,
      fileId,
      "file",
    );

    if (!permissions.includes("delete")) {
      throw new Error("You do not have permission to delete this file");
    }
  }

  const deletedFile = await fileRepository.softDelete(fileId);
  await activityLogService.log(userId, "File delete", "file", fileId);
  return deletedFile;
};

exports.downloadFile = async (userId, fileId) => {
  const file = await fileRepository.findById(fileId);
  if (!file) {
    return null;
  }

  // Owner luôn được download
  const owner = await permissionService.isOwner(userId, fileId, "file");
  if (!owner) {
    const permissions = await permissionService.resolvePermission(
      userId,
      fileId,
      "file",
    );

    if (!permissions.includes("download")) {
      throw new Error("You do not have permission to download this file");
    }
  }

  const filePath = storageService.getDownloadPath(file.storageName);
  return { file, filePath };
};
