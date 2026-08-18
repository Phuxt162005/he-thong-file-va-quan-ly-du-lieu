const crypto = require("crypto");
const bcrypt = require("bcrypt");

const shareRepository = require("../repositories/shareRepository");
const permissionService = require("./permissionService");
const File = require("../models/File");
const Folder = require("../models/Folder");
const storageService = require("./storageService");

exports.createShare = async (userId, data) => {
  if (!data.resourceId) {
    throw new Error("Resource ID is required");
  }
  if (!data.resourceType || !["file", "folder"].includes(data.resourceType)) {
    throw new Error("Invalid resource type");
  }

  /*
   * Người tạo Share phải có quyền quản lý Share trên Resource.
   * Owner luôn được phép hoặc phải có permission mới được share
   */
  const isOwner = await permissionService.isOwner(
    userId,
    data.resourceId,
    data.resourceType,
  );
  if (!isOwner) {
    const permissions = await permissionService.resolvePermission(
      userId,
      data.resourceId,
      data.resourceType,
    );
    if (!permissions.includes("share")) {
      throw new Error("You do not have permission to share this resource");
    }
  }

  // Tạo token ngẫu nhiên
  const token = crypto.randomBytes(32).toString("hex");

  // Password được hash trước khi lưu Database.
  let password = null;
  if (data.password) {
    password = await bcrypt.hash(data.password, 10);
  }

  return await shareRepository.create({
    resourceId: data.resourceId,
    resourceType: data.resourceType,
    owner: userId,
    token,
    password,
    expiresAt: data.expiresAt || null,
    maxDownloads: data.maxDownloads || null,
  });
};

exports.accessShare = async (token, password) => {
  const share = await shareRepository.findByToken(token);
  if (!share) {
    throw new Error("Share link not found");
  }

  // Kiểm tra hết hạn
  if (share.expiresAt && new Date() > share.expiresAt) {
    throw new Error("Share link has expired");
  }

  // Kiểm tra giới hạn download
  if (
    share.maxDownloads !== null &&
    share.downloadCount >= share.maxDownloads
  ) {
    throw new Error("Download limit exceeded");
  }

  // Kiểm tra password
  if (share.password) {
    if (!password) {
      throw new Error("Password required");
    }

    const valid = await bcrypt.compare(password, share.password);
    if (!valid) {
      throw new Error("Invalid password");
    }
  }
  return share;
};

exports.getSharedFolder = async (share) => {
  if (share.resourceType !== "folder") {
    throw new Error("Shared resource is not a folder");
  }

  const folder = await Folder.findOne({
    _id: share.resourceId,
    isDeleted: false,
  });
  if (!folder) {
    throw new Error("Shared folder not found");
  }
  return folder;
};

exports.getSharedFolderChildren = async (share, folderId) => {
  if (share.resourceType !== "folder") {
    throw new Error("Shared resource is not a folder");
  }

  const sharedFolder = await Folder.findOne({
    _id: share.resourceId,
    isDeleted: false,
  });
  if (!sharedFolder) {
    throw new Error("Shared folder not found");
  }

  const requestedFolder = await Folder.findOne({
    _id: folderId,
    isDeleted: false,
  });
  if (!requestedFolder) {
    throw new Error("Folder not found");
  }

  // Chỉ được truy cập Folder nằm bên trong cây của Folder được Share.
  let current = requestedFolder;
  while (current) {
    if (current._id.toString() === sharedFolder._id.toString()) {
      return {
        folder: requestedFolder,
        children: await Folder.find({
          parentFolder: requestedFolder._id,
          isDeleted: false,
        }),
      };
    }
    if (!current.parentFolder) {
      break;
    }

    current = await Folder.findOne({
      _id: current.parentFolder,
      isDeleted: false,
    });
  }
  throw new Error("Folder is outside the shared folder");
};

exports.getSharedFolderFiles = async (share, folderId) => {
  const result = await exports.getSharedFolderChildren(share, folderId);
  const files = await File.find({
    folder: result.folder._id,
    isDeleted: false,
  });

  return {
    folder: result.folder,
    folders: result.children,
    files,
  };
};

exports.getSharedFile = async (share) => {
  if (share.resourceType !== "file") {
    throw new Error("Shared resource is not a file");
  }

  const file = await File.findOne({ _id: share.resourceId, isDeleted: false });
  if (!file) {
    throw new Error("Shared file not found");
  }

  const filePath = storageService.getDownloadPath(file.storageName);
  return { file, filePath };
};

exports.completeSharedDownload = async (shareId) => {
  return await shareRepository.increaseDownloadCount(shareId);
};
