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

// lấy folder share con
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
      const folders = await Folder.find({
        parentFolder: requestedFolder._id,
        isDeleted: false,
      });
      const files = await File.find({
        folder: requestedFolder._id,
        isDeleted: false,
      });

      return {
        folder: requestedFolder,
        folders,
        files,
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

// lấy các file của folder share
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

// lấy 1 file của folder share
exports.getSharedFolderFile = async (share, fileId) => {
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

  const file = await File.findOne({ _id: fileId, isDeleted: false });
  if (!file) {
    throw new Error("Shared file not found");
  }
  // File phải nằm bên trong Folder được Share.
  if (!file.folder) {
    throw new Error("File is outside the shared folder");
  }

  let currentFolder = await Folder.findOne({
    _id: file.folder,
    isDeleted: false,
  });

  while (currentFolder) {
    // Đã tìm thấy Folder gốc của Share.
    if (currentFolder._id.toString() === sharedFolder._id.toString()) {
      const filePath = storageService.getDownloadPath(file.storageName);

      return { file, filePath };
    }
    // Đi lên Folder cha.
    if (!currentFolder.parentFolder) {
      break;
    }

    currentFolder = await Folder.findOne({
      _id: currentFolder.parentFolder,
      isDeleted: false,
    });
  }
  throw new Error("File is outside the shared folder");
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

// vô hiệu hóa Share Link
exports.disableShare = async (userId, shareId) => {
  const share = await shareRepository.findById(shareId);
  if (!share) {
    throw new Error("Share link not found");
  }

  // Người tạo Share là Owner của Share Link
  if (share.owner.toString() === userId.toString()) {
    return await shareRepository.disable(shareId);
  }

  // Nếu không phải Owner của Share, kiểm tra quyền share trên Resource.
  const permissions = await permissionService.resolvePermission(
    userId,
    share.resourceId,
    share.resourceType,
  );
  if (!permissions.includes("share")) {
    throw new Error("You do not have permission to disable this share link");
  }
  return await shareRepository.disable(shareId);
};

// lấy danh sách Share Link của User
exports.getMyShares = async (userId, status) => {
  return await shareRepository.findByOwner(userId, status);
};

exports.updateShare = async (userId, shareId, data) => {
  const share = await shareRepository.findById(shareId);
  if (!share) {
    throw new Error("Share link not found");
  }
  if (share.owner.toString() !== userId.toString()) {
    throw new Error("You do not own this share link");
  }

  if (data.maxDownloads !== null && data.maxDownloads !== undefined) {
    if (Number(data.maxDownloads) < 1) {
      throw new Error("maxDownloads must be greater than 0");
    }

    // Không cho giảm giới hạn xuống thấp hơn số lượt đã sử dụng.
    if (Number(data.maxDownloads) < share.downloadCount) {
      throw new Error(
        "maxDownloads cannot be lower than current download count",
      );
    }
  }

  if (data.expiresAt) {
    const expiresAt = new Date(data.expiresAt);
    if (expiresAt <= new Date()) {
      throw new Error("Expiration date must be in the future");
    }
  }

  const updateData = {
    expiresAt: data.expiresAt ?? share.expiresAt,
    maxDownloads: data.maxDownloads ?? share.maxDownloads,
  };

  // Password mới
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }
  return await shareRepository.update(shareId, updateData);
};

// lấy link share
exports.getShare = async (userId, shareId) => {
  const share = await shareRepository.findById(shareId);
  if (!share) {
    throw new Error("Share link not found");
  }
  if (share.owner.toString() !== userId.toString()) {
    throw new Error("You do not own this share link");
  }

  return share;
};

exports.completeSharedDownload = async (shareId) => {
  const share = await shareRepository.increaseDownloadCount(shareId);
  if (!share) {
    throw new Error("Download limit exceeded");
  }

  return share;
};
