const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/permissionController");

// cấp quyền
router.post("/", auth, controller.grant);

// chỉnh sửa quyền
router.put("/:id", auth, controller.update);

// thu hồi quyền
router.delete("/:id", auth, controller.revoke);

module.exports = router;
