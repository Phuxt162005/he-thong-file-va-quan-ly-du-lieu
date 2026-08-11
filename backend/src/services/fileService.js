const fileRepository = require("../repositories/fileRepository");
const activityLogService = require("./activityLogService");

exports.createFile = async (userId, folderId, fileData) => {
  // metadata chỉ được tạo sau khi Storage xử lý file thành công
  return await fileRepository.create({
    name: fileData.originalname,
    owner: userId,
    folder: folderId,
    storageName: fileData.filename,
    mimeType: fileData.mimeType,
    size: fileData.size,
  });
};

exports.getFile = async (fileId) => {
  // lấy file chưa bị soft delete
  return await fileRepository.findById(fileId);
};

exports.deleteFile = async (userId, fileId) => {
  // thực hiện soft delete
  const file = await fileRepository.softDelete(fileId);
  // ghi lại lịch sử
  await activityLogService.log(userId, "File delete", "file", fileId);
  return file;
};
