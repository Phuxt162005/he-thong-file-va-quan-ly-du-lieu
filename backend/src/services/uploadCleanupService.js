const uploadRepository = require("../repositories/uploadSessionRepository");

const chunkStorage = require("./chunkStorageService");

exports.cleanupExpiredUploads = async () => {
  const sessions = await uploadRepository.findExpired();

  for (const session of sessions) {
    try {
      // xóa toàn bộ Chunk còn tồn tại trên Disk
      chunkStorage.deleteUploadDirectory(session._id);
      // đánh dấu session đã hết hạn
      await uploadRepository.markExpired(session._id);
    } catch (error) {
      console.error(`Cleanup upload ${session._id} failed:`, error.message);
    }
  }

  return sessions.length;
};
