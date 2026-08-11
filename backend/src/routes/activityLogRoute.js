const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/activityLogController");

// xem lịch sử hoạt động của bản thân
router.get("/me", auth, controller.getMyActivities);

module.exports = router;
