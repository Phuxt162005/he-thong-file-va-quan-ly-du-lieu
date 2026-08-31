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
  const sourceFile = await fileRepository.findById(fileId);
  if (!sourceFile || sourceFile.isDeleted) {
    throw new Error("File not found");
  }

  const hasPermission = await permissionService.resolvePermission(
    userId,
    sourceFile._id,
    "file",
  );
  if (!hasPermission.includes("read")) {
    throw new Error("You do not have permission to copy this file");
  }

  await exports.checkUploadPermission(userId, destinationFolderId);
  let copied = null;

  try {
    copied = storageService.copyFile(sourceFile.storageName, sourceFile.name);
    const newFile = await fileRepository.create({
      owner: userId,
      folder: destinationFolderId,
      name: sourceFile.name,
      storageName: copied.storageName,
      mimeType: sourceFile.mimeType,
      size: sourceFile.size,
    });

    return newFile;
  } catch (error) {
    if (copied?.storageName) {
      try {
        if (storageService.fileExists(copied.storageName)) {
          storageService.deleteFile(copied.storageName);
        }
      } catch (cleanupError) {
        console.error("Failed to cleanup copied file:", cleanupError);
      }
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
  const file = await fileRepository.findDeletedById(fileId, userId);
  if (!file) {
    throw new Error("Deleted file not found");
  }
  if (!file.storageName) {
    throw new Error("File storage information is missing");
  }

  if (!storageService.fileExists(file.storageName)) {
    throw new Error("Physical file no longer exists and cannot be restored");
  }

  const restoredFile = await fileRepository.restore(fileId, userId);

  await activityLogService.log(userId, "File restore", "file", fileId);
  return restoredFile;
};

// xóa vĩnh viễn file
exports.permanentDeleteFile = async (userId, fileId) => {
  const file = await fileRepository.findDeletedById(fileId, userId);
  if (!file) {
    throw new Error("Deleted file not found");
  }

  // Xóa metadata trong Database trước.
  const deletedFile = await fileRepository.permanentDelete(fileId, userId);

  // Sau khi Database đã xóa thành công, mới xóa File vật lý.
  try {
    if (file.storageName && storageService.fileExists(file.storageName)) {
      storageService.deleteFile(file.storageName);
    }
  } catch (error) {
    console.error("Failed to delete physical file:", error);

    // Không rollback Database ở đây vì metadata đã bị xóa thành công. Có thể xử lý orphan storage bằng cleanup job.
  }
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
