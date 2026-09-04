const express = require("express");

const router = express.Router();
const passwordController = require("../controllers/passwordController");
const authMiddleware = require("../middleware/authMiddleware");

router.put("/change", authMiddleware, passwordController.changePassword);
router.post("/forgot", passwordController.forgotPassword);
router.post("/reset", passwordController.resetPassword);

module.exports = router;
