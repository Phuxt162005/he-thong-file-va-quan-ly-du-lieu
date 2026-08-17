const permissionRepository = require("../repositories/permissionRepository");
const Permission = require("../models/Permission");
const Folder = require("../models/Folder");
const File = require("../models/File");

// cấp quyền
exports.grantPermission = async (
  userId,
  resourceId,
  resourceType,
  permissions,
) => {
  // không cho phép tạo permission rỗng
  if (!permissions || permissions.length === 0) {
    throw new Error("Permission is required");
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
exports.updatePermission = async (permissionId, permissions) => {
  // cập nhật quyền mới cho các request tiếp theo
  return await permissionRepository.update(permissionId, permissions);
};

// thu hồi quyền
exports.revokePermission = async (permissionId) => {
  // thu hồi quyền truy cập
  return await permissionRepository.remove(permissionId);
};

// kiểm tra quyền
exports.resolvePermission = async (userId, resourceId, resourceType) => {
  // kiểm tra quyền trực tiếp trên Resource
  const direct = await Permission.findOne({
    user: userId,
    resourceId,
    resourceType,
  });
  if (direct) {
    return direct.permissions;
  }

  // nếu resource là Folder thì bắt đầu tìm quyền cha
  if (resourceType !== "folder") {
    return [];
  }

  let current = await Folder.findById(resourceId);

  while (current && current.parentFolder) {
    // tìm permission tại folder cha
    const inherited = await Permission.findOne({
      user: userId,
      resourceId: current.parentFolder,
      resourceType: "folder",
    });
    if (inherited) {
      return inherited.permissions;
    }

    // tiếp tục đi lên cây thư mục
    current = await Folder.findById(current.parentFolder);
  }
  return [];
};

// kiểm tra người dùng có quyền quản lý Permission hay không
exports.canManagePermission = async (userId, resourceId, resourceType) => {
  // kiểm tra quyền trực tiếp
  const direct = await Permission.findOne({
    user: userId,
    resourceId,
    resourceType,
  });
  if (direct && direct.permissions.includes("permission_management")) {
    return true;
  }

  // nếu là Folder thì kiểm tra quyền được kế thừa từ Folder cha
  if (resourceType === "folder") {
    let current = await Folder.findById(resourceId);

    while (current && current.parentFolder) {
      const inherited = await Permission.findOne({
        user: userId,
        resourceId: current.parentFolder,
        resourceType: "folder",
      });
      if (
        inherited &&
        inherited.permissions.includes("permission_management")
      ) {
        return true;
      }
      current = await Folder.findById(current.parentFolder);
    }
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
