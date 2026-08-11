const shareService = require("../services/shareService");

// tạo liên kết chia sẻ
exports.create = async (req, res) => {
  try {
    const share = await shareService.createShare(req.user.id, req.body);

    return res
      .status(201)
      .json({ message: "Share link created successfully", share });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// truy cập liên kết chia sẻ
exports.access = async (req, res) => {
  try {
    const share = await shareService.accessShare(
      req.params.id,
      req.body.password,
    );

    return res.json({
      resourceId: share.resourceId,
      resourceType: share.resourceType,
    });
  } catch (err) {
    return res.status(403).json({ message: err.message });
  }
};
