const userRepository = require("../repositories/userRepository");

// lấy hồ sơ người dùng
exports.getProfile = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

// tìm người dùng theo tên đăng nhập
exports.findByLoginName = async (username) => {
  if (typeof username !== "string" || !username.trim()) {
    throw new Error("Username is required");
  }

  return await userRepository.findByLoginName(username.trim());
};

// cập nhật hồ sơ
exports.updateProfile = async (id, data = {}) => {
  if (!id) {
    throw new Error("User ID is required");
  }
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid profile data");
  }

  const allowedData = {};
  if (data.username !== undefined) {
    if (typeof data.username !== "string" || !data.username.trim()) {
      throw new Error("Username is required");
    }

    const username = data.username.trim();
    if (username.length < 3 || username.length > 50) {
      throw new Error("Username must be between 3 and 50 characters");
    }
    allowedData.username = username;
  }

  if (data.email !== undefined) {
    if (typeof data.email !== "string" || !data.email.trim()) {
      throw new Error("Email is required");
    }

    const email = data.email.trim().toLowerCase();

    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email");
    }

    allowedData.email = email;
  }

  if (data.avatar !== undefined) {
    if (data.avatar !== null && typeof data.avatar !== "string") {
      throw new Error("Invalid avatar");
    }
    allowedData.avatar = data.avatar;
  }

  if (Object.keys(allowedData).length === 0) {
    throw new Error("No profile data to update");
  }

  try {
    const user = await userRepository.updateProfile(id, allowedData);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    if (error?.code === 11000) {
      throw new Error("Username already exists");
    }
    throw error;
  }
};
