const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/folderController");

// tạo thư mục
router.post("/", auth, controller.create);

// lấy danh sách thư mục con
router.get("/:id/children", auth, controller.children);

module.exports = router;
