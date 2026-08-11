const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// đăng nhập
router.post("/login", authController.login);

module.exports = router;
