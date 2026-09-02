const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/auditLogController");

router.get("/denied", auth, controller.getDeniedLogs);

module.exports = router;
