const Folder = require("../models/Folder");

// tạo thư mục mới
exports.create = (data) => {
  return Folder.create(data);
};

// lấy danh sách thư mục con
exports.findChildren = (parentId) => {
  return Folder.find({ parentFolder: parentId, isDeleted: false });
};
