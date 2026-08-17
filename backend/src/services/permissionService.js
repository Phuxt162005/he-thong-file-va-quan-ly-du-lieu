const permissionRepository = require("../repositories/permissionRepository");
const Permission = require("../models/Permission");
const Folder = require("../models/Folder");
const File = require("../models/File");

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
  // không cho phép tạo permission rỗng
  if (!permissions || permissions.length === 0) {
    throw new Error("Permission is required");
  }

  const canManage = await exports.canManagePermission(
    currentUserId,
    resourceId,
    resourceType,
  );
  if (!canManage) {
    throw new Error("You do not have permission to manage this resource!");
  }

  return await permissionRepository.create({
    user: userId,
    resourceId,
    resourceType,
    permissions,
    inherited: false,
  });
};

// lấy danh sách quyền của resource
exports.getPermissions = async (resourceId, resourceType) => {
  if (!resourceId || !resourceType) {
    throw new Error("Resource information is required");
  }

  if (!["file", "folder"].includes(resourceType)) {
    throw new Error("Invalid resource type");
  }

  return await permissionRepository.findByResource(resourceId, resourceType);
};

// cập nhật quyền
exports.updatePermission = async (currentUserId, permissionId, permissions) => {
  const permission = await Permission.findById(permissionId);
  if (!permission) {
    throw new Error("Permission not found.");
  }

  const canManage = await exports.canManagePermission(
    currentUserId,
    permission.resourceId,
    permission.resourceType,
  );
  if (!canManage) {
    throw new Error("You do not have permission to manage this resource!");
  }

  if (!permissions || permissions.length === 0) {
    throw new Error("Permission is required.");
  }
  // cập nhật quyền mới cho các request tiếp theo
  return await permissionRepository.update(permissionId, permissions);
};

// thu hồi quyền
exports.revokePermission = async (currentUserId, permissionId) => {
  const permission = await Permission.findById(permissionId);

  if (!permission) {
    throw new Error("Permission not found");
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
  // 1. Kiểm tra Permission trực tiếp
  const direct = await Permission.findOne({
    user: userId,
    resourceId,
    resourceType,
  });
  if (direct) {
    return direct.permissions;
  }

  /*
  // 2. Xác định Folder cần kiểm tra.
   * File: File -> Folder chứa File
   * Folder: Folder hiện tại
   */
  let currentFolder = null;

  if (resourceType === "file") {
    const file = await File.findById(resourceId);

    if (!file || !file.folder) {
      return [];
    }

    currentFolder = await Folder.findById(file.folder);
  } else if (resourceType === "folder") {
    currentFolder = await Folder.findById(resourceId);
  } else {
    return [];
  }

  // 3. Đi ngược lên cây Folder để tìm Permission được kế thừa.
  while (currentFolder) {
    const inherited = await Permission.findOne({
      user: userId,
      resourceId: currentFolder._id,
      resourceType: "folder",
    });

    if (inherited) {
      return inherited.permissions;
    }

    // Không còn Folder cha
    if (!currentFolder.parentFolder) {
      break;
    }

    // Đi lên Folder cha
    currentFolder = await Folder.findById(currentFolder.parentFolder);
  }
  // 4. Không tìm thấy quyền
  return [];
};
