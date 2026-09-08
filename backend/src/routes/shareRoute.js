const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/shareController");
const optionalAuth = require("../middleware/optionalAuthMiddleware");

// tạo liên kết chia sẻ
router.post("/", auth, controller.create);

// truy cập tài nguyên thông qua share link
router.post("/access/:token", optionalAuth, controller.access);

// lấy folder
router.post("/folder/:token", optionalAuth, controller.folder);

// lấy folder con
router.post(
  "/folder/:token/:folderId",
  optionalAuth,
  controller.folderChildren,
);

// download file thông qua share
router.post("/download/:token", optionalAuth, controller.download);
router.post(
  "/folder-download/:token/:fileId",
  optionalAuth,
  controller.folderDownload,
);

// danh sách Share Link
router.get("/", auth, controller.list);
router.get("/:id", auth, controller.get);

// cập nhật share link
router.put("/:id", auth, controller.update);

// vô hiệu hóa Share Link
router.delete("/:id", auth, controller.disable);

router.post("/preview/:token", optionalAuth, controller.preview);

module.exports = router;
