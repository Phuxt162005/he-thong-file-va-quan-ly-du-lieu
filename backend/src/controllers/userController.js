const userService = require("../services/userService");

// lấy thông tin cá nhân
exports.getProfile = async (req, res) => {
  const user = await userService.getProfile(req.user.id);
};

// tìm người dùng theo tên đăng nhập
exports.findByLoginName = async (req, res) => {
  try {
    const user = await userService.findByLoginName(req.query.login_name);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    return res.json(user);
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// cập nhật hồ sơ
exports.updateProfile = async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  return res.json(user);
};
