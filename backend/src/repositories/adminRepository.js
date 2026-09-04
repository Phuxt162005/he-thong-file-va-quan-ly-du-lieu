const User = require("../models/User");
const File = require("../models/File");
const Folder = require("../models/Folder");

exports.findUsers = () => {
  return User.find().select("-password").sort({ createdAt: -1 });
};

exports.findUserById = (userId) => {
  return User.findById(userId).select("-password");
};

exports.createUser = (data) => {
  return User.create(data);
};

exports.updateUser = (userId, data) => {
  return User.findByIdAndUpdate(
    userId,
    { $set: data },
    { new: true, runValidators: true },
  ).select("-password");
};

exports.deleteUser = (userId) => {
  return User.findByIdAndDelete(userId);
};

exports.getStorageStats = async () => {
  const [users, files] = await Promise.all([
    User.find().select("storageUsed storageLimit"),
    File.find({ isDeleted: false }).select("size owner"),
  ]);

  let totalStorageLimit = 0;
  let totalStorageUsed = 0;
  let totalFileSize = 0;
  for (const user of users) {
    totalStorageLimit += user.storageLimit || 0;
    totalStorageUsed += user.storageUsed || 0;
  }
  for (const file of files) {
    totalFileSize += file.size || 0;
  }
  const folderCount = await Folder.countDocuments({
    isDeleted: false,
  });

  return {
    users: users.length,
    files: files.length,
    folders: folderCount,
    totalStorageLimit,
    totalStorageUsed,
    totalFileSize,
    availableStorage: Math.max(totalStorageLimit - totalStorageUsed, 0),
  };
};

exports.getSystemStats = async () => {
  const [users, files, folders, deletedFiles, deletedFolders] =
    await Promise.all([
      User.countDocuments(),
      File.countDocuments({ isDeleted: false }),
      Folder.countDocuments({ isDeleted: false }),
      File.countDocuments({ isDeleted: true }),
      Folder.countDocuments({ isDeleted: true }),
    ]);

  return {
    users,
    files,
    folders,
    deletedFiles,
    deletedFolders,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || "development",
  };
};
