const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/auditLogController");

router.get("/denied", auth, (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  return controller.getDeniedLogs(req, res, next);
});

module.exports = router;
