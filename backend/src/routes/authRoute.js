const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// đăng nhập
router.post("/login", authController.login);

// đăng ký
router.post("/register", authController.register);

module.exports = router;
