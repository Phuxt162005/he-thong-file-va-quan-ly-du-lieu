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
exports.findByOwner = (ownerId, status) => {
  const query = {
    owner: ownerId,
  };

  if (status === "active") {
    query.isActive = true;
  } else if (status === "revoked") {
    query.isActive = false;
  }

  return ShareLink.find(query).select("-password").sort({
    createdAt: -1,
  });
};

exports.update = async (shareId, data) => {
  return ShareLink.findByIdAndUpdate(shareId, data, { new: true }).select(
    "-password",
  );
};
