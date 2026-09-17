const express = require("express");

const router = express.Router();

const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/notificationController");

router.get("/", auth, controller.list);

router.patch("/read-all", auth, controller.markAllRead);

router.patch("/:id/read", auth, controller.markRead);

module.exports = router;
