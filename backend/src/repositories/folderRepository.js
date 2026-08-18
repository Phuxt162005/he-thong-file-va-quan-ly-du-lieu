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
