const repository = require("../repositories/folderRepository");
const permissionService = require("./permissionService");
const activityLogService = require("./activityLogService");
const fileRepository = require("../repositories/fileRepository");
const storageService = require("./storageService");

// tạo thư mục
exports.createFolder = async (userId, data) => {
  if (!data || typeof data.name !== "string") {
    throw new Error("Folder name is required");
  }

  const name = data.name.trim();
  if (!name) {
    throw new Error("Folder name is required");
  }
  if (name.length > 255) {
    throw new Error("Folder name must not exceed 255 characters");
  }
  if (/[\/\\:*?"<>|]/.test(name)) {
    throw new Error("Folder name contains invalid characters");
  }

  const parentFolder = data.parentFolder || null;
  const duplicate = await repository.findDuplicateName(
    userId,
    parentFolder,
    name,
  );
  if (duplicate) {
    throw new Error("A folder with the same name already exists");
  }

  const folderData = {
    ...data,
    name,
    owner: userId,
    parentFolder,
  };
  if (parentFolder) {
    const parent = await repository.findById(parentFolder);
    if (!parent) {
      throw new Error("Parent folder not found");
    }
    const isOwner = await permissionService.isOwner(
      userId,
      parentFolder,
      "folder",
    );
    if (!isOwner) {
      const permissions = await permissionService.resolvePermission(
        userId,
        parentFolder,
        "folder",
      );
      if (!permissions.includes("write")) {
        throw new Error("You do not have permission to create a folder here");
      }
    }
  }
  return await repository.create(folderData);
};

// lấy folder theo folder parent
exports.getFolders = async (userId, parentFolder = null) => {
  if (parentFolder) {
    const folder = await repository.findById(parentFolder);
    if (!folder) {
      return null;
    }

    const owner = await permissionService.isOwner(
      userId,
      parentFolder,
      "folder",
    );
    if (!owner) {
      const permissions = await permissionService.resolvePermission(
        userId,
        parentFolder,
        "folder",
      );
      if (!permissions.includes("read")) {
        throw new Error("You do not have permission to read this folder");
      }
    }
  }
  return await repository.findVisibleByParent(userId, parentFolder);
};

// đổi tên Folder
exports.renameFolder = async (userId, folderId, name) => {
  if (typeof name !== "string") {
    throw new Error("Folder name is required");
  }

  name = name.trim();
  if (!name) {
    throw new Error("Folder name is required");
  }
  if (name.length > 255) {
    throw new Error("Folder name must not exceed 255 characters");
  }
  if (/[\/\\:*?"<>|]/.test(name)) {
    throw new Error("Folder name contains invalid characters");
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

  const duplicate = await repository.findDuplicateName(
    folder.owner,
    folder.parentFolder,
    name,
    folderId,
  );
  if (duplicate) {
    throw new Error("A folder with the same name already exists");
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

  const children = await repository.findChildren(folderId);
  const visibleChildren = [];
  for (const child of children) {
    const owner = await permissionService.isOwner(userId, child._id, "folder");
    if (owner) {
      visibleChildren.push(child);
      continue;
    }

    const permissions = await permissionService.resolvePermission(
      userId,
      child._id,
      "folder",
    );
    if (permissions.includes("read")) {
      visibleChildren.push(child);
    }
  }
  return visibleChildren;
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

exports.getDeletedFolders = async (userId) => {
  return await repository.findDeletedByOwner(userId);
};

// xóa folder vĩnh viễn
exports.permanentDeleteFolder = async (userId, folderId) => {
  const folder = await repository.findDeletedByOwnerAndId(folderId, userId);
  if (!folder) {
    throw new Error("Deleted folder not found");
  }

  // Lấy toàn bộ cây Folder đã xóa
  const folders = await repository.findDeletedTree(folderId);
  if (!folders || folders.length === 0) {
    throw new Error("Deleted folder tree not found");
  }

  const folderIds = folders.map((item) => item._id);
  for (const id of folderIds) {
    await permissionRepository.removeByResource(id, "folder");
  }

  // Lấy toàn bộ File đã xóa trong toàn bộ cây Folder
  const files = await fileRepository.findDeletedByFolders(folderIds);
  for (const file of files) {
    await permissionRepository.removeByResource(file._id, "file");
  }

  // Lưu storageName trước khi xóa metadata
  const storageNames = files.map((file) => file.storageName).filter(Boolean);

  // 1. XÓA FILE METADATA
  if (files.length > 0) {
    await fileRepository.permanentDeleteMany(files.map((file) => file._id));
  }

  // 2. XÓA FOLDER METADATA
  await repository.permanentDeleteMany(folderIds);

  // 3. XÓA FILE VẬT LÝ
  for (const storageName of storageNames) {
    try {
      if (storageService.fileExists(storageName)) {
        storageService.deleteFile(storageName);
      }
    } catch (error) {
      console.error(`Failed to delete physical file ${storageName}:`, error);
    }
  }

  // 4. ACTIVITY LOG
  await activityLogService.log(
    userId,
    "Folder permanent delete",
    "folder",
    folderId,
  );

  return folder;
};

exports.copyFolder = async (userId, folderId, destinationFolderId = null) => {
  // 1. Kiểm tra Folder nguồn
  const sourceFolder = await repository.findById(folderId);
  if (!sourceFolder) {
    throw new Error("Folder not found");
  }

  const sourceOwner = await permissionService.isOwner(
    userId,
    folderId,
    "folder",
  );
  if (!sourceOwner) {
    const sourcePermissions = await permissionService.resolvePermission(
      userId,
      folderId,
      "folder",
    );
    if (!sourcePermissions.includes("read")) {
      throw new Error("You do not have permission to copy this folder");
    }
  }

  // 2. Kiểm tra Folder đích
  if (destinationFolderId) {
    // Không copy vào chính nó
    if (destinationFolderId.toString() === folderId.toString()) {
      throw new Error("Cannot copy folder into itself");
    }

    // Không copy vào Folder con của chính nó
    const isDescendant = await repository.isDescendant(
      folderId,
      destinationFolderId,
    );
    if (isDescendant) {
      throw new Error("Cannot copy folder into its own descendant");
    }

    const destinationFolder = await repository.findById(destinationFolderId);
    if (!destinationFolder) {
      throw new Error("Destination folder not found");
    }

    // Kiểm tra quyền write
    const destinationOwner = await permissionService.isOwner(
      userId,
      destinationFolderId,
      "folder",
    );
    if (!destinationOwner) {
      const permissions = await permissionService.resolvePermission(
        userId,
        destinationFolderId,
        "folder",
      );
      if (!permissions.includes("write")) {
        throw new Error("You do not have permission to copy into this folder");
      }
    }
  }

  // 3. Lấy toàn bộ cây Folder nguồn
  const sourceFolders = await repository.findTreeForCopy(folderId);
  if (sourceFolders.length === 0) {
    throw new Error("Folder tree not found");
  }

  // 4. Chuẩn bị rollback
  const createdFolderIds = [];
  const copiedFileIds = [];
  const copiedStorageNames = [];

  try {
    // 5. Tạo cây Folder mới
    const folderMap = new Map();
    for (const source of sourceFolders) {
      let newParent = destinationFolderId || null;

      // Nếu không phải Root Folder thì Parent mới là Folder mới tương ứng với Parent cũ.
      if (source._id.toString() !== folderId.toString()) {
        const mappedParent = folderMap.get(source.parentFolder.toString());
        if (!mappedParent) {
          throw new Error(`Parent folder mapping not found: ${source.name}`);
        }
        newParent = mappedParent;
      }

      const newFolder = await repository.create({
        name: source.name,
        owner: userId,
        parentFolder: newParent,
        path: source.path,
        isDeleted: false,
      });
      createdFolderIds.push(newFolder._id);
      folderMap.set(source._id.toString(), newFolder._id);
    }

    // 6. Lấy File nguồn
    const sourceFolderIds = sourceFolders.map((folder) => folder._id);
    const sourceFiles = await fileRepository.findByFoldersForCopy(
      sourceFolderIds,
      userId,
    );

    // 7. Copy từng File
    for (const sourceFile of sourceFiles) {
      // File vật lý phải tồn tại
      if (
        !sourceFile.storageName ||
        !storageService.fileExists(sourceFile.storageName)
      ) {
        throw new Error(`Physical file not found: ${sourceFile.name}`);
      }

      // Xác định Folder mới
      const newFolderId = folderMap.get(sourceFile.folder.toString());
      if (!newFolderId) {
        throw new Error(
          `Destination folder mapping not found for file: ${sourceFile.name}`,
        );
      }

      // Copy vật lý
      const copiedStorage = storageService.copyFile(
        sourceFile.storageName,
        sourceFile.name,
      );

      // Ghi ngay vào danh sách rollback
      copiedStorageNames.push(copiedStorage.storageName);

      // Tạo metadata mới
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
      copiedFileIds.push(copiedFile._id);
    }

    // 8. Activity Log
    await activityLogService.log(userId, "Folder copy", "folder", folderId);

    // 9. Thành công
    return {
      folderId: createdFolderIds[0],
      copiedFolders: createdFolderIds.length,
      copiedFiles: copiedFileIds.length,
    };
  } catch (error) {
    // ROLLBACK FILE METADATA
    if (copiedFileIds.length > 0) {
      await fileRepository.deleteByIds(copiedFileIds);
    }

    // ROLLBACK FILE STORAGE
    for (const storageName of copiedStorageNames) {
      try {
        if (storageService.fileExists(storageName)) {
          storageService.deleteFile(storageName);
        }
      } catch (cleanupError) {
        console.error(
          "Failed to cleanup copied file:",
          storageName,
          cleanupError,
        );
      }
    }

    // ROLLBACK FOLDER METADATA
    if (createdFolderIds.length > 0) {
      await repository.deleteByIds(createdFolderIds);
    }
    throw error;
  }
};
