const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// đăng nhập
router.post("/login", authController.login);

// đăng ký
router.post("/register", authController.register);

// quên mật khẩu
router.post("/password/forgot", authController.forgotPassword);

// đặt lại mật khẩu
router.post("/password/reset", authController.resetPassword);

module.exports = router;
