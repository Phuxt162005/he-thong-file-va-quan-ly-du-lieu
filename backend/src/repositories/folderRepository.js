const Folder = require("../models/Folder");

// tạo thư mục mới
exports.create = (data) => {
  return Folder.create(data);
};

// lấy thư mục con
exports.findChildren = (parentId) => {
  return Folder.find({
    parentFolder: parentId,
    isDeleted: false,
  });
};

// tìm Folder
exports.findById = (folderId) => {
  return Folder.findOne({
    _id: folderId,
    isDeleted: false,
  });
};

// đổi tên Folder
exports.rename = (folderId, name) => {
  return Folder.findOneAndUpdate(
    { _id: folderId, isDeleted: false },
    { name },
    { new: true },
  );
};

// soft delete Folder
exports.softDelete = (folderId) => {
  return Folder.findOneAndUpdate(
    { _id: folderId, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );
};

// di chuyển Folder
exports.move = (folderId, parentFolder) => {
  return Folder.findOneAndUpdate(
    { _id: folderId, isDeleted: false },
    { parentFolder },
    { new: true },
  );
};

// lấy toàn bộ Folder con trực tiếp
exports.findChildrenIncludingDeleted = (parentId) => {
  return Folder.find({ parentFolder: parentId });
};

// soft delete Folder
exports.softDeleteCascade = async (folderId) => {
  const folderIds = [folderId];

  let currentIds = [folderId];
  while (currentIds.length > 0) {
    const children = await Folder.find({
      parentFolder: { $in: currentIds },
      isDeleted: false,
    }).select("_id");

    const childIds = children.map((folder) => folder._id);
    if (childIds.length === 0) {
      break;
    }

    folderIds.push(...childIds);
    currentIds = childIds;
  }

  await Folder.updateMany(
    { _id: { $in: folderIds }, isDeleted: false },
    { $set: { isDeleted: true } },
  );
  return Folder.findOne({ _id: folderId });
};

exports.findByIdIncludingDeleted = (folderId) => {
  return Folder.findById(folderId);
};

exports.hasDeletedParent = async (folder) => {
  let currentParent = folder.parentFolder;

  while (currentParent) {
    const parent = await Folder.findById(currentParent);
    if (!parent) {
      return false;
    }
    if (parent.isDeleted) {
      return true;
    }
    currentParent = parent.parentFolder;
  }
  return false;
};

exports.restoreTree = async (folderId) => {
  const folderIds = [folderId];

  let currentIds = [folderId];

  while (currentIds.length > 0) {
    const children = await Folder.find({
      parentFolder: { $in: currentIds },
      isDeleted: true,
    }).select("_id");
    if (children.length === 0) {
      break;
    }

    const childIds = children.map((child) => child._id);
    folderIds.push(...childIds);
    currentIds = childIds;
  }

  await Folder.updateMany(
    { _id: { $in: folderIds }, isDeleted: true },
    { $set: { isDeleted: false } },
  );

  return Folder.findOne({ _id: folderId });
};

exports.findDeletedByOwner = async (ownerId) => {
  const folders = await Folder.find({ owner: ownerId, isDeleted: true }).sort({
    updatedAt: -1,
  });
  const deletedIds = new Set(folders.map((folder) => folder._id.toString()));

  // Chỉ lấy Folder không có parentFolder đang nằm trong chính danh sách Folder đã xóa.
  return folders.filter((folder) => {
    if (!folder.parentFolder) {
      return true;
    }
    return !deletedIds.has(folder.parentFolder.toString());
  });
};

exports.findDeletedRootsByOwner = async (ownerId) => {
  const folders = await Folder.find({ owner: ownerId, isDeleted: true }).sort({
    updatedAt: -1,
  });
  return folders.filter((folder) => {
    if (!folder.parentFolder) {
      return true;
    }
    const parent = folders.find(
      (item) => item._id.toString() === folder.parentFolder.toString(),
    );
    return !parent;
  });
};

exports.findDeletedTree = async (folderId) => {
  const folderIds = [folderId];
  let currentIds = [folderId];
  while (currentIds.length > 0) {
    const children = await Folder.find({
      parentFolder: { $in: currentIds },
      isDeleted: true,
    }).select("_id");
    if (children.length === 0) {
      break;
    }
    const childIds = children.map((folder) => folder._id);
    folderIds.push(...childIds);
    currentIds = childIds;
  }
  return Folder.find({ _id: { $in: folderIds }, isDeleted: true });
};

exports.findDeletedByOwnerAndId = (folderId, ownerId) => {
  return Folder.findOne({
    _id: folderId,
    owner: ownerId,
    isDeleted: true,
  });
};

exports.findByOwnerAndParent = (ownerId, parentFolder = null) => {
  return Folder.find({
    owner: ownerId,
    parentFolder,
    isDeleted: false,
  }).sort({ name: 1 });
};

exports.permanentDeleteMany = (folderIds) => {
  return Folder.deleteMany({ _id: { $in: folderIds }, isDeleted: true });
};
