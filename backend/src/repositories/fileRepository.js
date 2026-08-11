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
exports.create.softDelete = (id) => {
  return File.findByIdAndUpdate(
    id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  );
};
