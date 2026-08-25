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
  return ShareLink.findById(shareId).select("-password");
};

// tăng số lượt download
exports.increaseDownloadCount = (id) => {
  return ShareLink.findOneAndUpdate(
    {
      _id: id,
      isActive: true,
      $or: [
        { maxDownloads: null },
        { $expr: { $lt: ["$downloadCount", "$maxDownloads"] } },
      ],
    },
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
    query.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];
  } else if (status === "expired") {
    query.isActive = true;
    query.expiresAt = { $lte: new Date() };
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
