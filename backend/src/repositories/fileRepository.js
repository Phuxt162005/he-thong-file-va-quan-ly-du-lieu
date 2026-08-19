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

// soft delete toàn bộ File trong các Folder
exports.softDeleteByFolders = (folderIds) => {
  return File.updateMany(
    { folder: { $in: folderIds }, isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date() } },
  );
};

exports.findDeletedByIdWithFolder = (fileId, ownerId) => {
  return File.findOne({
    _id: fileId,
    owner: ownerId,
    isDeleted: true,
  }).populate("folder");
};
