const crypto = require("crypto");
const bcrypt = require("bcrypt");

const shareRepository = require("../repositories/shareRepository");

exports.createShare = async (userId, data) => {
  // sinh token ngẫu nhiên cho URL chia sẻ
  const token = crypto.randomBytes(32).toString("hex");

  let password = null;

  // không lưu mật khẩu dạng plaintext
  if (data.password) {
    password = await bcrypt.hash(data.password, 10);
  }

  return await shareRepository.create({
    resourceId: data.resourceId,
    resourceType: data.resourceType,
    owner: userId,
    token,
    password,
    expiresAt: data.expiresAt || null,
    maxDownloads: data.maxDownloads || null,
  });
};

exports.accessShare = async (token, password) => {
  const share = await shareRepository.findByToken(token);
  if (!share) {
    throw Error("Share link not found");
  }

  // kiểm tra thời gian hết hạn
  if (share.expiresAt && new Date() > share.expiresAt) {
    throw new Error("Share link has expired");
  }

  // kiểm tra số lượt download
  if (
    share.maxDownloads !== null &&
    share.downloadCount >= share.maxDownloads
  ) {
    throw new Error("Download limit exceeded");
  }

  //   kiểm tra mật khẩu nếu link được bảo vệ
  if (share.password) {
    if (!password) {
      throw new Error("Password required");
    }

    const valid = await bcrypt.compare(password, share.password);
    if (!valid) {
      throw new Error("Invalid password");
    }
  }
  return share;
};
