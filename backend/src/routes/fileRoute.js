const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/fileController");
const uploadController = require("../controllers/uploadController");

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

// các API hiện tại
router.get("/:id/download", auth, controller.download);
router.get("/:id", auth, controller.getFile);
router.delete("/:id", auth, controller.deleteFile);

module.exports = router;
