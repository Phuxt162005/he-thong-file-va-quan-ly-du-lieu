const crypto = require("crypto");
const bcrypt = require("bcrypt");

const shareRepository = require("../repositories/shareRepository");
const permissionService = require("./permissionService");

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

  /*
   * Truy cập thành công.
   * Tăng số lượt sử dụng.
   */
  const updatedShare = await shareRepository.increaseDownloadCount(share._id);
  return updatedShare;
};
