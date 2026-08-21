const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/folderController");

// ========================
// Folder đặc biệt
// ========================

// Recycle Bin
router.get("/trash", auth, controller.getTrash);

// ========================
// Folder
// ========================

// folder con theo folder cha
router.get("/", auth, controller.list);

// tạo thư mục
router.post("/", auth, controller.create);

// lấy danh sách thư mục con
router.get("/:id/children", auth, controller.children);

// di chuyển
router.put("/:id/move", auth, controller.move);

// đổi tên
router.put("/:id", auth, controller.rename);

// khôi phục
router.put("/:id/restore", auth, controller.restore);

// xóa vĩnh viễn
router.delete("/:id/permanent", auth, controller.permanentDelete);

// xóa mềm
router.delete("/:id", auth, controller.remove);

// lấy thông tin folder
router.get("/:id", auth, controller.get);

module.exports = router;
