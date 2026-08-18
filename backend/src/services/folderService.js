const repository = require("../repositories/folderRepository");
const permissionService = require("./permissionService");

// tạo thư mục
exports.createFolder = async (userId, data) => {
  data.name = data.name.trim();
  data.owner = userId;

  // Nếu tạo Folder bên trong một Folder khác thì phải có quyền write trên Folder cha.
  if (data.parentFolder) {
    const parent = await repository.findById(data.parentFolder);
    if (!parent) {
      throw new Error("Parent folder not found");
    }

    const isOwner = await permissionService.isOwner(
      userId,
      data.parentFolder,
      "folder",
    );
    if (!isOwner) {
      const permissions = await permissionService.resolvePermission(
        userId,
        data.parentFolder,
        "folder",
      );

      if (!permissions.includes("write")) {
        throw new Error("You do not have permission to create a folder here");
      }
    }
  }
  return await repository.create(data);
};

// đổi tên Folder
exports.renameFolder = async (userId, folderId, name) => {
  name = name.trim();
  if (!name) {
    throw new Error("Folder name is required");
  }

  const folder = await repository.findById(folderId);
  if (!folder) {
    return null;
  }

  const isOwner = await permissionService.isOwner(userId, folderId, "folder");
  if (!isOwner) {
    const permissions = await permissionService.resolvePermission(
      userId,
      folderId,
      "folder",
    );

    if (!permissions.includes("write")) {
      throw new Error("You do not have permission to rename this folder");
    }
  }
  return await repository.rename(folderId, name);
};

// xóa Folder
exports.deleteFolder = async (userId, folderId) => {
  const folder = await repository.findById(folderId);
  if (!folder) {
    return null;
  }

  const isOwner = await permissionService.isOwner(userId, folderId, "folder");
  if (!isOwner) {
    const permissions = await permissionService.resolvePermission(
      userId,
      folderId,
      "folder",
    );

    if (!permissions.includes("delete")) {
      throw new Error("You do not have permission to delete this folder");
    }
  }
  return await repository.softDelete(folderId);
};

exports.getChildren = async (folderId) => {
  return await repository.findChildren(folderId);
};
