const fileRepository = require("../repositories/fileRepository");
const activityLogService = require("./activityLogService");
const permissionService = require("./permissionService");
const storageService = require("./storageService");
const permissionRepository = require("../repositories/permissionRepository");
const folderRepository = require("../repositories/folderRepository");
const httpError = require("../utils/httpError");

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
        throw new httpError(
          "You do not have permission to upload files to this folder",
          403,
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
    throw new httpError("You do not have permission to read this file", 403);
  }
  return file;
};

exports.getFilesByFolder = async (userId, folderId = null) => {
  if (folderId) {
    const folder = await folderRepository.findById(folderId);
    if (!folder) {
      return null;
    }

    const owner = await permissionService.isOwner(userId, folderId, "folder");
    if (!owner) {
      const permissions = await permissionService.resolvePermission(
        userId,
        folderId,
        "folder",
      );
      if (!permissions.includes("read")) {
        throw new httpError(
          "You do not have permission to read this folder",
          403,
        );
      }
    }
  }

  const files = await fileRepository.findByFolder(folderId);
  const visibleFiles = [];
  for (const file of files) {
    const owner = await permissionService.isOwner(userId, file._id, "file");
    if (owner) {
      visibleFiles.push(file);
      continue;
    }

    const permissions = await permissionService.resolvePermission(
      userId,
      file._id,
      "file",
    );
    if (permissions.includes("read")) {
      visibleFiles.push(file);
    }
  }
  return visibleFiles;
};

exports.copyFile = async (userId, fileId, destinationFolderId = null) => {
  const sourceFile = await fileRepository.findById(fileId);

  if (!sourceFile || sourceFile.isDeleted) {
    throw new httpError("File not found", 404);
  }

  // Owner luôn được phép copy
  const owner = await permissionService.isOwner(userId, fileId, "file");

  if (!owner) {
    const permissions = await permissionService.resolvePermission(
      userId,
      fileId,
      "file",
    );

    if (!permissions.includes("read")) {
      throw new httpError("You do not have permission to copy this file", 403);
    }
  }

  // Kiểm tra quyền ghi tại Folder đích
  await exports.checkUploadPermission(userId, destinationFolderId);

  let copied = null;

  try {
    // File nguồn phải tồn tại trong Storage
    if (
      !sourceFile.storageName ||
      !storageService.fileExists(sourceFile.storageName)
    ) {
      throw new httpError("Physical file not found, 404");
    }

    // Copy File vật lý
    copied = storageService.copyFile(sourceFile.storageName, sourceFile.name);

    // Tạo metadata File mới
    const newFile = await fileRepository.copy({
      owner: userId,
      folder: destinationFolderId,
      name: sourceFile.name,
      storageName: copied.storageName,
      mimeType: sourceFile.mimeType,
      size: sourceFile.size,
      isDeleted: false,
      deletedAt: null,
    });

    return newFile;
  } catch (error) {
    // Nếu Database tạo metadata thất bại, xóa File vật lý vừa copy để tránh File rác.
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
      throw new httpError(
        "You do not have permission to delete this file",
        403,
      );
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
      throw new httpError(
        "You do not have permission to download this file",
        403,
      );
    }
  }

  if (!file.storageName || !storageService.fileExists(file.storageName)) {
    throw new httpError("Physical file not found", 404);
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
      throw new httpError(
        "You do not have permission to preview this file",
        403,
      );
    }
  }

  if (!file.storageName || !storageService.fileExists(file.storageName)) {
    throw new httpError("Physical file not found", 404);
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
    throw new httpError(
      "You do not have permission to upload files to this folder",
      403,
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
    throw new httpError("Deleted file not found", 404);
  }
  if (!file.storageName) {
    throw new httpError("File storage information is missing", 404);
  }

  if (!storageService.fileExists(file.storageName)) {
    throw new httpError(
      "Physical file no longer exists and cannot be restored",
      404,
    );
  }

  const restoredFile = await fileRepository.restore(fileId);
  if (!restoredFile) {
    throw new httpError("File could not be restored", 500);
  }

  await activityLogService.log(userId, "File restore", "file", fileId);
  return restoredFile;
};

// xóa vĩnh viễn file
exports.permanentDeleteFile = async (userId, fileId) => {
  const file = await fileRepository.findDeletedById(fileId, userId);
  if (!file) {
    throw new httpError("Deleted file not found", 404);
  }
  if (!file.storageName) {
    throw new httpError("File storage information is missing", 404);
  }

  // Xóa File vật lý trước.
  try {
    if (storageService.fileExists(file.storageName)) {
      storageService.deleteFile(file.storageName);
    }
  } catch (error) {
    console.error("Failed to delete physical file:", error);
    throw new httpError("Physical file could not be deleted", 500);
  }

  // Sau khi File vật lý đã được xử lý thành công mới xóa metadata trong Database.
  const deletedFile = await fileRepository.permanentDelete(fileId, userId);
  if (!deletedFile) {
    throw new httpError("File metadata could not be deleted", 500);
  }

  await activityLogService.log(userId, "File permanent delete", "file", fileId);
  return deletedFile;
};

exports.renameFile = async (userId, fileId, newName) => {
  const file = await fileRepository.findById(fileId);
  if (!file) {
    throw new httpError("File not found", 404);
  }

  const owner = await permissionService.isOwner(userId, fileId, "file");
  if (!owner) {
    const permissions = await permissionService.resolvePermission(
      userId,
      fileId,
      "file",
    );
    if (!permissions.includes("write")) {
      throw new httpError(
        "You do not have permission to rename this file",
        403,
      );
    }
  }

  if (typeof newName !== "string" || !newName.trim()) {
    throw new httpError("File name is required", 400);
  }

  const name = newName.trim();
  if (name.length > 255) {
    throw new httpError("File name must not exceed 255 characters", 400);
  }

  if (/[<>:"/\\|?*\x00-\x1F]/.test(name)) {
    throw new httpError("File name contains invalid characters", 400);
  }

  const renamedFile = await fileRepository.updateName(fileId, name);
  if (!renamedFile) {
    throw new httpError("File could not be renamed", 500);
  }

  await activityLogService.log(userId, "File rename", "file", fileId);
  return renamedFile;
};
