const service = require("../services/notificationService");

exports.list = async (req, res) => {
  try {
    const result = await service.list(req.user.id, req.query.limit);

    return res.json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const notification = await service.markRead(req.user.id, req.params.id);

    return res.json(notification);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const result = await service.markAllRead(req.user.id);

    return res.json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
