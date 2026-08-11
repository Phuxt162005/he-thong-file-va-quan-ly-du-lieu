const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/userController");

// lấy hồ sơ người dùng
router.get("/profile", auth, controller.getProfile);

// cập nhật hồ sơ
router.put("/profile", auth, controller.updateProfile);

module.exports = router;
