const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");
const RefreshToken = require("../models/RefreshToken");

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
    throw httpError("Invalid username or password", 401);
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

    throw httpError("Invalid username or password!", 401);
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT secret is not configured");
  }
  //   sinh Access Token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  const refreshToken = crypto.randomBytes(64).toString("hex");

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const userData = user.toObject();
  delete userData.password;

  return { token, refreshToken, user: userData };
};

exports.register = async (username, email, password) => {
  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
  });
  if (existingUser) {
    if (existingUser.username === normalizedUsername) {
      throw httpError("Username already exists", 409);
    }
    throw httpError("Email already exists", 409);
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
    });
    await auditLogService.log({
      userId: user._id,
      action: "REGISTER",
      result: "SUCCESS",
    });

    const userData = user.toObject();
    delete userData.password;
    return userData;
  } catch (error) {
    if (error?.code === 11000) {
      if (error.keyPattern?.email) {
        throw httpError("Email already exists", 409);
      }
      throw httpError("Username already exists", 409);
    }
    throw error;
  }
};
