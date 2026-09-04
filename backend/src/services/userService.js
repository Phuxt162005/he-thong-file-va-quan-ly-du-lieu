const userRepository = require("../repositories/userRepository");
const httpError = require("../utils/httpError");

// lấy hồ sơ người dùng
exports.getProfile = async (userId) => {
  if (!userId) {
    throw new httpError("User ID is required", 400);
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new httpError("User not found", 404);
  }
  return user;
};

// tìm người dùng theo tên đăng nhập
exports.findByLoginName = async (username) => {
  if (typeof username !== "string" || !username.trim()) {
    throw new httpError("Username is required", 400);
  }

  return await userRepository.findByLoginName(username.trim());
};

// cập nhật hồ sơ
exports.updateProfile = async (id, data = {}) => {
  if (!id) {
    throw new httpError("User ID is required", 400);
  }
  if (typeof data !== "object" || data === null) {
    throw new httpError("Invalid profile data", 400);
  }

  const allowedData = {};
  if (data.username !== undefined) {
    if (typeof data.username !== "string" || !data.username.trim()) {
      throw new httpError("Username is required", 400);
    }

    const username = data.username.trim();
    if (username.length < 3 || username.length > 50) {
      throw new httpError("Username must be between 3 and 50 characters", 400);
    }
    allowedData.username = username;
  }

  if (data.email !== undefined) {
    if (typeof data.email !== "string" || !data.email.trim()) {
      throw new httpError("Email is required", 400);
    }

    const email = data.email.trim().toLowerCase();

    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new httpError("Invalid email", 400);
    }

    allowedData.email = email;
  }

  if (data.avatar !== undefined) {
    if (data.avatar !== null && typeof data.avatar !== "string") {
      throw new httpError("Invalid avatar", 400);
    }
    allowedData.avatar = data.avatar;
  }

  if (Object.keys(allowedData).length === 0) {
    throw new httpError("No profile data to update", 404);
  }

  try {
    const user = await userRepository.updateProfile(id, allowedData);
    if (!user) {
      throw new httpError("User not found", 404);
    }
    return user;
  } catch (error) {
    if (error?.code === 11000) {
      throw new httpError("Username already exists", 509);
    }
    throw error;
  }
};
