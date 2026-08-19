const File = require("../models/File");

// tạo metadata cho file
exports.create = (data) => {
  return File.create(data);
};

// tìm file chưa bị xóa
exports.findById = (id) => {
  return File.findOne({ _id: id, isDeleted: false });
};

// đánh dấu file đã xóa
exports.softDelete = (id) => {
  return File.findByIdAndUpdate(
    id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  );
};

// lấy các File đã xóa của User
exports.findDeletedByOwner = (ownerId) => {
  return File.find({
    owner: ownerId,
    isDeleted: true,
  }).sort({
    deletedAt: -1,
  });
};

// khôi phục File
exports.restore = (fileId) => {
  return File.findOneAndUpdate(
    { _id: fileId, isDeleted: true },
    { isDeleted: false, deletedAt: null },
    { new: true },
  );
};

exports.findDeletedById = (fileId, ownerId) => {
  return File.findOne({
    _id: fileId,
    owner: ownerId,
    isDeleted: true,
  });
};

exports.restoreByFolders = (folderIds) => {
  return File.updateMany(
    { folder: { $in: folderIds }, isDeleted: true },
    { $set: { isDeleted: false, deletedAt: null } },
  );
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

exports.findDeletedByIdWithFolder = (fileId, ownerId) => {
  return File.findOne({
    _id: fileId,
    owner: ownerId,
    isDeleted: true,
  }).populate("folder");
};

exports.restoreFile = async (userId, fileId) => {
  const file = await fileRepository.findDeletedByIdWithFolder(fileId, userId);
  if (!file) {
    throw new Error("Deleted file not found");
  }
  if (file.folder && file.folder.isDeleted) {
    throw new Error(
      "Cannot restore this file because its parent folder is deleted",
    );
  }
  return await fileRepository.restore(fileId);
};
