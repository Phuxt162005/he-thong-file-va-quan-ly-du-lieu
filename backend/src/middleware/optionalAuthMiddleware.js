const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
  } catch (error) {
    // Token không hợp lệ thì coi như Guest.
    // Public Share vẫn hoạt động.
    req.user = undefined;
  }

  next();
};
