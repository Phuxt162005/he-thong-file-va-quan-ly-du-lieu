const fileRepository = require("../repositories/fileRepository");
const activityLogService = require("./activityLogService");
const permissionService = require("./permissionService");
const storageService = require("./storageService");
const folderRepository = require("../repositories/folderRepository");

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

exports.copyFile = async (userId, fileId, destinationFolderId = null) => {
  // File nguồn phải thuộc User và chưa bị xóa.
  const sourceFile = await fileRepository.findById(fileId);
  if (!sourceFile) {
    throw new Error("File not found");
  }

  // Nếu copy vào Folder thì Folder đích phải tồn tại, chưa bị xóa và thuộc User.
  if (destinationFolderId) {
    const destinationFolder =
      await folderRepository.findById(destinationFolderId);
    if (!destinationFolder) {
      throw new Error("Destination folder not found");
    }
    if (destinationFolder.owner.toString() !== userId.toString()) {
      throw new Error("You do not have permission to copy into this folder");
    }
  }

  // File vật lý phải tồn tại.
  if (
    !sourceFile.storageName ||
    !storageService.fileExists(sourceFile.storageName)
  ) {
    throw new Error("Physical file not found");
  }

  // Copy File vật lý.
  const copiedStorage = storageService.copyFile(
    sourceFile.storageName,
    sourceFile.name,
  );

  try {
    // Tạo metadata mới.
    const copiedFile = await fileRepository.copy({
      name: sourceFile.name,
      owner: userId,
      folder: destinationFolderId || null,
      storageName: copiedStorage.storageName,
      mimeType: sourceFile.mimeType,
      size: sourceFile.size,
      isDeleted: false,
      deletedAt: null,
    });
    await activityLogService.log(userId, "File copy", "file", copiedFile._id);

    return copiedFile;
  } catch (error) {
    // Nếu MongoDB tạo metadata thất bại phải xóa File vật lý vừa copy.
    if (storageService.fileExists(copiedStorage.storageName)) {
      storageService.deleteFile(copiedStorage.storageName);
    }
    throw error;
  }
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

  // Chỉ trả về khi File vật lý thực sự tồn tại.
  const filePath = storageService.getDownloadPath(file.storageName);

  // Ghi Activity Log sau khi đã xác thực quyền và Storage tồn tại.
  await activityLogService.log(userId, "File download", "file", fileId);

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

exports.renameFile = async (userId, fileId, newName) => {
  const file = await fileRepository.findById(fileId);
  if (!file) {
    throw new Error("File not found");
  }

  const owner = await permissionService.isOwner(userId, fileId, "file");
  if (!owner) {
    const permissions = await permissionService.resolvePermission(
      userId,
      fileId,
      "file",
    );
    if (!permissions.includes("write")) {
      throw new Error("You do not have permission to rename this file");
    }
  }

  if (typeof newName !== "string" || !newName.trim()) {
    throw new Error("File name is required");
  }

  const name = newName.trim();
  if (name.length > 255) {
    throw new Error("File name must not exceed 255 characters");
  }

  if (/[<>:"/\\|?*\x00-\x1F]/.test(name)) {
    throw new Error("File name contains invalid characters");
  }

  const renamedFile = await fileRepository.updateName(fileId, name);
  await activityLogService.log(userId, "File rename", "file", fileId);
  return renamedFile;
};
