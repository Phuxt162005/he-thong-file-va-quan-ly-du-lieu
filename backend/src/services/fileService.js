const fileRepository = require("../repositories/fileRepository");
const activityLogService = require("./activityLogService");
const permissionService = require("./permissionService");
const storageService = require("./storageService");

exports.createFile = async (userId, folderId, fileData) => {
  // Nếu upload vào Root thì không cần kiểm tra Folder.
  if (folderId) {
    const owner = await permissionService.isOwner(userId, folderId, "folder");
    if (!owner) {
      const permissions = await permissionService.resolvePermission(
        userId,
        folderId,
        "folder",
      );

      if (!permissions.includes("write")) {
        throw new Error(
          "You do not have permission to upload files to this folder",
        );
      }
    }
  }

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

// preview file
exports.previewFile = async (userId, fileId) => {
  const file = await fileRepository.findById(fileId);
  if (!file) {
    return null;
  }

  // Owner luôn được preview
  const owner = await permissionService.isOwner(userId, fileId, "file");
  if (!owner) {
    const permissions = await permissionService.resolvePermission(
      userId,
      fileId,
      "file",
    );

    // Preview cần quyền read.
    if (!permissions.includes("read")) {
      throw new Error("You do not have permission to preview this file");
    }
  }

  const filePath = storageService.getDownloadPath(file.storageName);
  return { file, filePath };
};

exports.checkUploadPermission = async (userId, folderId) => {
  if (!folderId) {
    return true;
  }

  const owner = await permissionService.isOwner(userId, folderId, "folder");
  if (owner) {
    return true;
  }

  const permissions = await permissionService.resolvePermission(
    userId,
    folderId,
    "folder",
  );
  if (!permissions.includes("write")) {
    throw new Error(
      "You do not have permission to upload files to this folder",
    );
  }
  return true;
};

// lấy File trong Recycle Bin
exports.getDeletedFiles = async (userId) => {
  return await fileRepository.findDeletedByOwner(userId);
};

// khôi phục File
exports.restoreFile = async (userId, fileId) => {
  const file = await fileRepository.findDeletedByIdWithFolder(fileId, userId);
  if (!file) {
    throw new Error("Deleted file not found");
  }
  if (file.folder && file.folder.isDeleted) {
    throw new Error(
      "Cannot restore this file because its parent folder is deleted",
    );
  }
  return await fileRepository.restore(fileId);
};

// xóa vĩnh viễn file
exports.permanentDeleteFile = async (userId, fileId) => {
  const file = await fileRepository.findDeletedById(fileId, userId);
  if (!file) {
    throw new Error("Deleted file not found");
  }
  // Xóa file vật lý
  if (file.storageName && storageService.fileExists(file.storageName)) {
    storageService.deleteFile(file.storageName);
  }
  // Xóa metadata
  const deletedFile = await fileRepository.permanentDelete(fileId, userId);
  // Ghi lịch sử
  await activityLogService.log(userId, "File permanent delete", "file", fileId);
  return deletedFile;
};
