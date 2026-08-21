const repository = require("../repositories/folderRepository");
const permissionService = require("./permissionService");
const fileRepository = require("../repositories/fileRepository");
const storageService = require("./storageService");

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

// lấy folder theo folder parent
exports.getFolders = async (userId, parentFolder = null) => {
  return await repository.findByOwnerAndParent(userId, parentFolder);
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
  return await repository.softDeleteCascade(folderId);
};

// lấy thông tin Folder
exports.getFolder = async (userId, folderId) => {
  const folder = await repository.findById(folderId);
  if (!folder) {
    return null;
  }

  // Owner luôn được xem
  const isOwner = await permissionService.isOwner(userId, folderId, "folder");
  if (isOwner) {
    return folder;
  }

  // Kiểm tra quyền read
  const permissions = await permissionService.resolvePermission(
    userId,
    folderId,
    "folder",
  );
  if (!permissions.includes("read")) {
    throw new Error("You do not have permission to read this folder");
  }
  return folder;
};

exports.getChildren = async (userId, folderId) => {
  const folder = await repository.findById(folderId);
  if (!folder) {
    return null;
  }

  // Owner luôn được xem Folder
  const isOwner = await permissionService.isOwner(userId, folderId, "folder");
  if (!isOwner) {
    const permissions = await permissionService.resolvePermission(
      userId,
      folderId,
      "folder",
    );

    if (!permissions.includes("read")) {
      throw new Error("You do not have permission to read this folder");
    }
  }
  return await repository.findChildren(folderId);
};

// di chuyển Folder
exports.moveFolder = async (userId, folderId, newParentFolder) => {
  const folder = await repository.findById(folderId);
  if (!folder) {
    return null;
  }

  // Không được đặt Folder vào chính nó.
  if (newParentFolder && folderId.toString() === newParentFolder.toString()) {
    throw new Error("Cannot move folder into itself");
  }
  // Kiểm tra Folder đích tồn tại.
  let destination = null;

  if (newParentFolder) {
    destination = await repository.findById(newParentFolder);
    if (!destination) {
      throw new Error("Destination folder not found");
    }
  }

  // Không được di chuyển Folder vào bên trong chính cây con
  let current = destination;
  while (current) {
    if (current._id.toString() === folderId.toString()) {
      throw new Error("Cannot move folder into its own descendant");
    }
    if (!current.parentFolder) {
      break;
    }
    current = await repository.findById(current.parentFolder);
  }

  /*
   * Kiểm tra quyền tại Folder hiện tại.
   * Muốn lấy Folder ra khỏi Folder cha thì phải có write trên Folder cha.
   */
  if (folder.parentFolder) {
    const sourceOwner = await permissionService.isOwner(
      userId,
      folder.parentFolder,
      "folder",
    );
    if (!sourceOwner) {
      const sourcePermissions = await permissionService.resolvePermission(
        userId,
        folder.parentFolder,
        "folder",
      );
      if (!sourcePermissions.includes("write")) {
        throw new Error(
          "You do not have permission to move this folder from its current location",
        );
      }
    }
  } else {
    // Folder ở Root. Chỉ Owner được phép di chuyển Root Folder.
    const owner = await permissionService.isOwner(userId, folderId, "folder");
    if (!owner) {
      throw new Error("Only the owner can move a root folder");
    }
  }

  /*
   * Kiểm tra quyền tại Folder đích.
   * Muốn đặt Folder vào Folder đích phải có write trên Folder đích.
   */
  if (newParentFolder) {
    const destinationOwner = await permissionService.isOwner(
      userId,
      newParentFolder,
      "folder",
    );
    if (!destinationOwner) {
      const destinationPermissions = await permissionService.resolvePermission(
        userId,
        newParentFolder,
        "folder",
      );

      if (!destinationPermissions.includes("write")) {
        throw new Error("You do not have permission to move a folder here");
      }
    }
  }
  return await repository.move(folderId, newParentFolder || null);
};

// khôi phục Folder
exports.restoreFolder = async (userId, folderId) => {
  const folder = await repository.findDeletedById(folderId, userId);
  if (!folder) {
    throw new Error("Deleted folder not found");
  }

  const hasDeletedParent = await repository.hasDeletedParent(folder);
  if (hasDeletedParent) {
    throw new Error(
      "Cannot restore this folder because its parent folder is deleted",
    );
  }

  // Restore toàn bộ cây Folder
  const restored = await repository.restoreTree(folderId);

  // Lấy lại danh sách Folder đã được restore để tìm File.
  const folderIds = [folderId];
  let currentIds = [folderId];
  while (currentIds.length > 0) {
    const children = await repository.findChildrenByIds(currentIds);
    if (children.length === 0) {
      break;
    }

    const childIds = children.map((child) => child._id);
    folderIds.push(...childIds);
    currentIds = childIds;
  }
  // Restore File trong cây.
  await fileRepository.restoreByFolders(folderIds);
  return restored;
};

exports.findDeletedByOwner = async (ownerId) => {
  const folders = await Folder.find({
    owner: ownerId,
    isDeleted: true,
  }).sort({ updatedAt: -1 });

  const deletedIds = new Set(folders.map((folder) => folder._id.toString()));
  return folders.filter((folder) => {
    if (!folder.parentFolder) {
      return true;
    }
    return !deletedIds.has(folder.parentFolder.toString());
  });
};

exports.getDeletedFolders = async (userId) => {
  return await repository.findDeletedByOwner(userId);
};

// xóa folder vĩnh viễn
exports.permanentDeleteFolder = async (userId, folderId) => {
  // Chỉ xử lý Folder đã bị soft delete.
  const root = await repository.findDeletedByOwnerAndId(folderId, userId);
  if (!root) {
    throw new Error("Deleted folder not found");
  }

  // Lấy toàn bộ cây Folder.
  const folders = await repository.findDeletedTree(folderId);
  const folderIds = folders.map((folder) => folder._id);

  // Lấy toàn bộ File trong cây.
  const files = await fileRepository.findDeletedByFolders(folderIds);

  // Xóa File vật lý khỏi Storage.
  for (const file of files) {
    if (file.storageName && storageService.fileExists(file.storageName)) {
      storageService.deleteFile(file.storageName);
    }
  }
  // Sau khi Storage đã được xử lý, xóa metadata File.
  if (files.length > 0) {
    await fileRepository.permanentDeleteMany(files.map((file) => file._id));
  }
  // Cuối cùng xóa toàn bộ Folder.
  await repository.permanentDeleteMany(folderIds);
  return {
    folderId,
    deletedFolders: folderIds.length,
    deletedFiles: files.length,
  };
};

exports.copyFolder = async (userId, folderId, destinationFolderId = null) => {
  // Folder nguồn
  const sourceFolder = await repository.findByIdAndOwner(folderId, userId);

  if (!sourceFolder) {
    throw new Error("Folder not found");
  }

  // Kiểm tra Folder đích
  if (destinationFolderId) {
    const destinationFolder = await repository.findById(destinationFolderId);
    if (!destinationFolder) {
      throw new Error("Destination folder not found");
    }
    if (destinationFolder.owner.toString() !== userId.toString()) {
      throw new Error("You do not have permission to copy into this folder");
    }
  }
  // Lấy toàn bộ cây
  const sourceFolders = await repository.findTreeForCopy(folderId, userId);
  // Map Folder cũ → Folder mới
  const folderMap = new Map();

  // Tạo Folder mới theo thứ tự từ cha xuống con.
  for (const source of sourceFolders) {
    let newParent = destinationFolderId || null;
    if (source._id.toString() !== folderId.toString()) {
      const mappedParent = folderMap.get(source.parentFolder.toString());
      newParent = mappedParent;
    }

    const newFolder = await repository.create({
      name: source.name,
      owner: userId,
      parentFolder: newParent,
      path: source.path,
      isDeleted: false,
    });

    folderMap.set(source._id.toString(), newFolder._id);
  }
  // Copy toàn bộ File.
  const sourceFolderIds = sourceFolders.map((folder) => folder._id);
  const sourceFiles = await fileRepository.findByFoldersForCopy(
    sourceFolderIds,
    userId,
  );
  const copiedFiles = [];

  try {
    for (const sourceFile of sourceFiles) {
      if (
        !sourceFile.storageName ||
        !storageService.fileExists(sourceFile.storageName)
      ) {
        throw new Error(`Physical file not found: ${sourceFile.name}`);
      }

      const copiedStorage = storageService.copyFile(
        sourceFile.storageName,
        sourceFile.name,
      );
      const newFolderId = folderMap.get(sourceFile.folder.toString());
      const copiedFile = await fileRepository.copy({
        name: sourceFile.name,
        owner: userId,
        folder: newFolderId,
        storageName: copiedStorage.storageName,
        mimeType: sourceFile.mimeType,
        size: sourceFile.size,
        isDeleted: false,
        deletedAt: null,
      });

      copiedFiles.push({
        metadata: copiedFile,
        storageName: copiedStorage.storageName,
      });
    }
  } catch (error) {
    // Nếu copy File thất bại giữa chừng, dọn các File vật lý đã copy.
    for (const copied of copiedFiles) {
      if (storageService.fileExists(copied.storageName)) {
        storageService.deleteFile(copied.storageName);
      }
    }
    throw error;
  }
  await activityLogService.log(userId, "Folder copy", "folder", folderId);

  return {
    folderId: folderMap.get(folderId.toString()),
    copiedFolders: sourceFolders.length,
    copiedFiles: copiedFiles.length,
  };
};
