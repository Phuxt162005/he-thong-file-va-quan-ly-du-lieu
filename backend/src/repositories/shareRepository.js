const ShareLink = require("../models/ShareLink");

// tạo share link
exports.create = (data) => {
  return ShareLink.create(data);
};

// tìm link theo token
exports.findByToken = (token) => {
  return ShareLink.findOne({ token, isActive: true });
};

// tìm Share theo ID
exports.findById = (shareId) => {
  return ShareLink.findById(shareId);
};

// tăng số lượt download
exports.increaseDownloadCount = (id) => {
  return ShareLink.findByIdAndUpdate(
    id,
    { $inc: { downloadCount: 1 } },
    { new: true },
  );
};

// vô hiệu hóa link
exports.disable = (id) => {
  return ShareLink.findByIdAndUpdate(id, { isActive: false }, { new: true });
};

// lấy các Share Link của User
exports.findByOwner = (ownerId) => {
  return ShareLink.find({ owner: ownerId })
    .select("-password")
    .sort({ createdAt: -1 });
};
