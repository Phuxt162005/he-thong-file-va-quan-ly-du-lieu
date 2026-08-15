const uploadCleanupService = require("../services/uploadCleanupService");

const CLEANUP_INTERVAL = 60 * 60 * 1000;

// chạy cleanup khi server khởi động
const runCleanup = async () => {
  try {
    const count = await uploadCleanupService.cleanupExpiredUploads();

    if (count > 0) {
      console.log(`Cleaned ${count} expired upload session(s).`);
    }
  } catch (error) {
    console.error("Upload cleanup failed:", error.message);
  }
};

// chạy 1 lần khi server start
runCleanup();

// chạy mỗi 1 giờ
setInterval(runCleanup, CLEANUP_INTERVAL);
