const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auditLogService = require("./auditLogService");
const httpError = require("../utils/httpError");

exports.login = async (username, password, ipAddress) => {
  // tìm tài khoản theo username
  const user = await User.findOne({ username }).select("+password");
  if (!user) {
    // ghi nhận đăng nhập thất bại
    await auditLogService.log({
      action: "LOGIN_FAILED",
      result: "FAILED",
      ipAddress,
      details: { username },
    });
    throw new httpError("Invalid username or password", 401);
  }

  //   so sánh mật khẩu đã mã hóa
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    await auditLogService.log({
      userId: user._id,
      action: "LOGIN_FAILED",
      result: "FAILED",
      ipAddress,
    });

    throw new Error("Invalid username or password!");
  }

  //   sinh Access Token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
  const userData = user.toObject();
  delete userData.password;

  return { token, user: userData };
};
