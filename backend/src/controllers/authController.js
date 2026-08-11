const authService = require("../services/authService");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    // gọi service xử lý đăng nhập
    const result = await authService.login(username, password);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(401).json({ message: err.message });
  }
};
