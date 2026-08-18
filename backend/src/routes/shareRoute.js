const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/shareController");

// tạo liên kết chia sẻ
router.post("/", auth, controller.create);

// truy cập tài nguyên thông qua share link
router.post("/access/:token", controller.access);

// lấy folder
router.post("/folder/:token", controller.folder);

// lấy folder con
router.post("/folder/:token/:folderId", controller.folderChildren);

// download file thông qua share
router.post("/download/:token", controller.download);
router.post("/folder-download/:token/:fileId", controller.download);

module.exports = router;
