const express = require("express");
const router = express.Router();

const logoutController = require("../controllers/logoutController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, logoutController.logout);

module.exports = router;
