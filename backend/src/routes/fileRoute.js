const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/fileController");
const uploadController = require("../controllers/uploadController");
const upload = require("../middleware/uploadMiddleware");

// chunk upload
router.post("/upload/initiate", auth, uploadController.initiate);

router.post(
  "/upload/:uploadId/chunk",
  auth,
  express.raw({ type: "application/octet-stream", limit: "10mb" }),
  uploadController.uploadChunk,
);

router.get("/upload/:uploadId/status", auth, uploadController.status);

router.post("/upload/:uploadId/complete", auth, uploadController.complete);

// upload file thường
router.post("/upload", auth, upload.single("file"), controller.upload);

// recycle Bin
router.get("/trash", auth, controller.getTrash);

// ========================
// File
// ========================

// download
router.get("/:id/download", auth, controller.download);

// preview
router.get("/:id/preview", auth, controller.preview);

// restore
router.put("/:id/restore", auth, controller.restore);

// permanent delete
router.delete("/:id/permanent", auth, controller.permanentDelete);

// delete
router.delete("/:id", auth, controller.deleteFile);

// lấy thông tin file
router.get("/:id", auth, controller.getFile);
