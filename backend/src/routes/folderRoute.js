const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/folderController");

// tạo thư mục
router.post("/", auth, controller.create);

// lấy danh sách thư mục con
router.get("/:id/children", auth, controller.children);

// lấy thông tin folder
router.get("/:id", auth, controller.get);

// di chuyển
router.put("/:id/move", auth, controller.move);

// đổi tên
router.put("/:id", auth, controller.rename);

// xóa
router.delete("/:id", auth, controller.remove);

// khôi phục folder bị soft delete
router.put("/:id/restore", auth, controller.restore);

module.exports = router;
