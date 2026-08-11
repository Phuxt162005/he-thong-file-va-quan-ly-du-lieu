const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/fileController");

// xem thông tin file
router.get("/:id", auth, controller.getFile);

// xóa file
router.delete("/:id", auth, controller.deleteFile);

// upload file
router.post("/upload", auth, upload.single("file"), controller.upload);

module.exports = router;
