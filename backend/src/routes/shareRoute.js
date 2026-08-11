const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/shareController");

// tạo liên kết chia sẻ
router.post("/", auth, controller.create);

// truy cập tài nguyên thông qua share link
router.post("/access/:token", controller.access);

module.exports = router;
