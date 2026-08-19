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

// soft delete toàn bộ File trong các Folder
exports.softDeleteByFolders = (folderIds) => {
  return File.updateMany(
    { folder: { $in: folderIds }, isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date() } },
  );
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
