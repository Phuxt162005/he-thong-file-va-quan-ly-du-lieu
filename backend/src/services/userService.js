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
  if (!username) {
    throw new Error("Username is required");
  }
  return await userRepository.findByLoginName(username.trim());
};

// cập nhật hồ sơ
exports.updateProfile = async (id, data) => {
  return await userRepository.updateProfile(id, data);
};
