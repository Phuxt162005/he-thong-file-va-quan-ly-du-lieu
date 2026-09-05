const File = require("../models/File");

// tạo metadata cho file
exports.create = (data) => {
  return File.create(data);
};

// tạo metadata cho File được copy
exports.copy = (data) => {
  return File.create(data);
};

// tìm file chưa bị xóa
exports.findById = (id) => {
  return File.findOne({ _id: id, isDeleted: false });
};

exports.findByFolder = (folderId) => {
  return File.find({
    folder: folderId,
    isDeleted: false,
  }).sort({ name: 1 });
};

// đánh dấu file đã xóa
exports.softDelete = (id) => {
  return File.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { new: true, runValidators: true },
  );
};

// lấy các File đã xóa của User
exports.findDeletedByOwner = (ownerId) => {
  return File.find({ owner: ownerId, isDeleted: true })
    .populate("folder", "name")
    .sort({ deletedAt: -1 });
};

// khôi phục File
exports.restore = (fileId) => {
  return File.findOneAndUpdate(
    { _id: fileId, isDeleted: true },
    { $set: { isDeleted: false, deletedAt: null } },
    { new: true, runValidators: true },
  );
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

// tìm File đã xóa của chính Owner
exports.findDeletedById = (fileId, ownerId) => {
  return File.findOne({
    _id: fileId,
    owner: ownerId,
    isDeleted: true,
  });
};

exports.findDeletedByFolders = (folderIds) => {
  return File.find({ folder: { $in: folderIds }, isDeleted: true });
};

// xóa vĩnh viễn metadata
exports.permanentDelete = (fileId, ownerId) => {
  return File.findOneAndDelete({
    _id: fileId,
    owner: ownerId,
    isDeleted: true,
  });
};

// xóa nhiều file vĩnh viễn
exports.permanentDeleteMany = (fileIds) => {
  return File.deleteMany({ _id: { $in: fileIds }, isDeleted: true });
};

exports.findByFoldersForCopy = (folderIds, ownerId) => {
  return File.find({
    folder: { $in: folderIds },
    owner: ownerId,
    isDeleted: false,
  });
};

exports.deleteByIds = (fileIds) => {
  return File.deleteMany({ _id: { $in: fileIds } });
};

exports.updateName = async (fileId, name) => {
  return await File.findOneAndUpdate(
    { _id: fileId, isDeleted: false },
    { $set: { name } },
    { new: true, runValidators: true },
  );
};

exports.move = (fileId, destinationFolderId) => {
  return File.findOneAndUpdate(
    { _id: fileId, isDeleted: false },
    { $set: { folder: destinationFolderId || null } },
    { new: true, runValidators: true },
  );
};

exports.findOneByNameAndFolder = (name, folderId, excludeFileId = null) => {
  const query = {
    name,
    folder: folderId || null,
    isDeleted: false,
  };
  if (excludeFileId) {
    query._id = { $ne: excludeFileId };
  }

  return File.findOne(query);
};

const handleSubmit = async (event) => {
  event.preventDefault();

  setError("");
  setMessage("");

  if (!token) {
    setError("Liên kết đặt lại mật khẩu không hợp lệ.");
    return;
  }

  if (!formData.password) {
    setError("Vui lòng nhập mật khẩu mới.");
    return;
  }

  if (formData.password.length < 8) {
    setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
    return;
  }

  if (!formData.confirmPassword) {
    setError("Vui lòng xác nhận mật khẩu mới.");
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    setError("Mật khẩu xác nhận không khớp.");
    return;
  }

  try {
    setLoading(true);

    await authService.resetPassword({
      resetToken: token,
      newPassword: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    setMessage("Đặt lại mật khẩu thành công!");

    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 1000);
  } catch (err) {
    setError(err?.message || "Không thể đặt lại mật khẩu.");
  } finally {
    setLoading(false);
  }
};

exports.getStorageUsedByOwner = async (ownerId) => {
  const result = await File.aggregate([
    { $match: { owner: ownerId, isDeleted: false } },
    { $group: { _id: null, total: { $sum: "$size" } } },
  ]);

  return result[0]?.total || 0;
};
