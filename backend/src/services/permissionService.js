const permissionRepository = require("../repositories/permissionRepository");
const Permission = require("../models/Permission");
const Folder = require("../models/Folder");
const File = require("../models/File");
const User = require("../models/User");

// kiểm tra người dùng có quyền quản lý Permission hay không
exports.canManagePermission = async (userId, resourceId, resourceType) => {
  // Owner luôn được quản lý Permission
  const owner = await exports.isOwner(userId, resourceId, resourceType);
  if (owner) {
    return true;
  }

  // kiểm tra Permission trực tiếp
  const direct = await Permission.findOne({
    user: userId,
    resourceId,
    resourceType,
  });

  if (direct && direct.permissions.includes("permission_management")) {
    return true;
  }

  /*
   * Xác định Folder chứa Resource:
   * Nếu Resource là File: File -> folder
   * Nếu Resource là Folder: Folder hiện tại
   */
  let currentFolder = null;
  if (resourceType === "file") {
    const file = await File.findById(resourceId);

    if (!file || !file.folder) {
      return false;
    }

    currentFolder = await Folder.findById(file.folder);
  } else if (resourceType === "folder") {
    currentFolder = await Folder.findById(resourceId);
  }

  // Đi ngược lên cây thư mục.
  while (currentFolder) {
    const inherited = await Permission.findOne({
      user: userId,
      resourceId: currentFolder._id,
      resourceType: "folder",
    });

    if (inherited && inherited.permissions.includes("permission_management")) {
      return true;
    }

    // Nếu Folder hiện tại có Folder cha thì tiếp tục đi lên.
    if (!currentFolder.parentFolder) {
      break;
    }

    currentFolder = await Folder.findById(currentFolder.parentFolder);
  }
  return false;
};

// kiểm tra người dùng có phải Owner hay không
exports.isOwner = async (userId, resourceId, resourceType) => {
  let resource;

  if (resourceType === "file") {
    resource = await File.findById(resourceId);
  } else if (resourceType === "folder") {
    resource = await Folder.findById(resourceId);
  }
  if (!resource) {
    return false;
  }
  return resource.owner.toString() === userId.toString();
};

// cấp quyền
exports.grantPermission = async (
  currentUserId,
  userId,
  resourceId,
  resourceType,
  permissions,
) => {
  if (!userId || !resourceId || !resourceType) {
    throw new Error("Permission information is required");
  }

  if (!["file", "folder"].includes(resourceType)) {
    throw new Error("Invalid resource type");
  }

  if (!Array.isArray(permissions) || permissions.length === 0) {
    throw new Error("Permission is required");
  }

  const getResource = async (resourceId, resourceType) => {
    if (resourceType === "file") {
      return await File.findById(resourceId);
    }
    if (resourceType === "folder") {
      return await Folder.findById(resourceId);
    }
    return null;
  };

  const isTargetOwner = await exports.isOwner(userId, resourceId, resourceType);
  if (isTargetOwner) {
    throw new Error("Cannot grant permission to the resource owner");
  }

  const validPermissions = [
    "read",
    "write",
    "download",
    "delete",
    "share",
    "permission_management",
  ];
  const uniquePermissions = [...new Set(permissions)];
  const invalidPermission = uniquePermissions.find(
    (permission) => !validPermissions.includes(permission),
  );
  if (invalidPermission) {
    throw new Error(`Invalid permission: ${invalidPermission}`);
  }

  const canManage = await exports.canManagePermission(
    currentUserId,
    resourceId,
    resourceType,
  );
  if (!canManage) {
    throw new Error("You do not have permission to manage this resource!");
  }

  const currentUserIsOwner = await exports.isOwner(
    currentUserId,
    resourceId,
    resourceType,
  );

  if (
    uniquePermissions.includes("permission_management") &&
    !currentUserIsOwner
  ) {
    throw new Error("Only the resource owner can grant permission_management");
  }

  const existing = await Permission.findOne({
    user: userId,
    resourceId,
    resourceType,
  });
  if (existing) {
    const mergedPermissions = [
      ...new Set([...existing.permissions, ...uniquePermissions]),
    ];
    return await permissionRepository.update(existing._id, mergedPermissions);
  }

  const resource = await getResource(resourceId, resourceType);
  if (!resource) {
    throw new Error("Resource not found");
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new Error("Target user not found");
  }

  return await permissionRepository.create({
    user: userId,
    resourceId,
    resourceType,
    permissions: uniquePermissions,
    inherited: false,
  });
};

// lấy danh sách quyền của resource
exports.getPermissions = async (currentUserId, resourceId, resourceType) => {
  if (!resourceId || !resourceType) {
    throw new Error("Resource information is required");
  }

  if (!["file", "folder"].includes(resourceType)) {
    throw new Error("Invalid resource type");
  }

  const canManage = await exports.canManagePermission(
    currentUserId,
    resourceId,
    resourceType,
  );
  if (!canManage) {
    throw new Error("You do not have permission to view permissions");
  }

  return await permissionRepository.findByResource(resourceId, resourceType);
};

// cập nhật quyền
exports.updatePermission = async (currentUserId, permissionId, permissions) => {
  const permission = await Permission.findById(permissionId);
  if (!permission) {
    throw new Error("Permission not found.");
  }

  const isOwner = await exports.isOwner(
    permission.user,
    permission.resourceId,
    permission.resourceType,
  );
  if (isOwner) {
    throw new Error("Cannot modify owner's permission");
  }

  const canManage = await exports.canManagePermission(
    currentUserId,
    permission.resourceId,
    permission.resourceType,
  );
  if (!canManage) {
    throw new Error("You do not have permission to manage this resource!");
  }

  const validPermissions = [
    "read",
    "write",
    "download",
    "delete",
    "share",
    "permission_management",
  ];
  if (!Array.isArray(permissions) || permissions.length === 0) {
    throw new Error("Permission is required.");
  }

  const uniquePermissions = [...new Set(permissions)];

  const invalidPermission = uniquePermissions.find(
    (permission) => !validPermissions.includes(permission),
  );
  if (invalidPermission) {
    throw new Error(`Invalid permission: ${invalidPermission}`);
  }

  // Chỉ Owner mới được cấp permission_management
  const currentUserIsOwner = await exports.isOwner(
    currentUserId,
    permission.resourceId,
    permission.resourceType,
  );

  if (
    uniquePermissions.includes("permission_management") &&
    !currentUserIsOwner
  ) {
    throw new Error("Only the resource owner can grant permission_management");
  }
  return await permissionRepository.update(permissionId, uniquePermissions);
};

// thu hồi quyền
exports.revokePermission = async (currentUserId, permissionId) => {
  const permission = await Permission.findById(permissionId);
  if (!permission) {
    throw new Error("Permission not found");
  }

  const isOwner = await exports.isOwner(
    permission.user,
    permission.resourceId,
    permission.resourceType,
  );
  if (isOwner) {
    throw new Error("Cannot revoke owner's permission");
  }

  const canManage = await exports.canManagePermission(
    currentUserId,
    permission.resourceId,
    permission.resourceType,
  );

  if (!canManage) {
    throw new Error("You do not have permission to manage this resource");
  }
  return await permissionRepository.remove(permissionId);
};

// kiểm tra quyền thực tế của User trên Resource
exports.resolvePermission = async (userId, resourceId, resourceType) => {
  if (!userId || !resourceId || !["file", "folder"].includes(resourceType)) {
    return [];
  }

  const permissions = new Set();
  // 1. Permission trực tiếp trên Resource
  const direct = await Permission.findOne({
    user: userId,
    resourceId,
    resourceType,
  });
  if (direct) {
    direct.permissions.forEach((permission) => permissions.add(permission));
  }

  // 2. Xác định Folder cần bắt đầu
  let currentFolder = null;
  if (resourceType === "file") {
    const file = await File.findById(resourceId);
    if (!file) {
      return [...permissions];
    }
    if (file.folder) {
      currentFolder = await Folder.findById(file.folder);
    }
  } else {
    currentFolder = await Folder.findById(resourceId);
  }

  // 3. Đi ngược cây Folder
  while (currentFolder) {
    const inherited = await Permission.findOne({
      user: userId,
      resourceId: currentFolder._id,
      resourceType: "folder",
    });
    if (inherited) {
      inherited.permissions.forEach((permission) =>
        permissions.add(permission),
      );
    }
    if (!currentFolder.parentFolder) {
      break;
    }
    currentFolder = await Folder.findById(currentFolder.parentFolder);
  }
  return [...permissions];
};
