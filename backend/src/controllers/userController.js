const userService = require("../services/userService");

// lấy thông tin cá nhân
exports.getProfile = async (req, res) => {
  try {
    const user = await userService.getProfile(req.user.id);
    return res.json(user);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
// tìm người dùng theo tên đăng nhập
exports.findByLoginName = async (req, res) => {
  try {
    const user = await userService.findByLoginName(req.query.username);
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
  try {
    const { username, email, avatar } = req.body;
    const user = await userService.updateProfile(req.user.id, {
      username,
      email,
      avatar,
    });

    return res.json(user);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
