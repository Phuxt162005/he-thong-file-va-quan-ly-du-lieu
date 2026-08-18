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

exports.download = async (req, res) => {
  try {
    const share = await shareService.accessShare(
      req.params.token,
      req.body.password,
    );
    const result = await shareService.getSharedFile(share);

    res.download(result.filePath, result.file.name, async (error) => {
      if (error) {
        return;
      }
      await shareService.completeSharedDownload(share._id);
    });
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};

exports.folder = async (req, res) => {
  try {
    const share = await shareService.accessShare(
      req.params.token,
      req.body.password,
    );

    if (share.resourceType !== "folder") {
      return res
        .status(400)
        .json({ message: "Shared resource is not a folder" });
    }

    const result = await shareService.getSharedFolderFiles(
      share,
      share.resourceId,
    );

    return res.json({
      folder: result.folder,
      folders: result.folders,
      files: result.files,
    });
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};

exports.folderChildren = async (req, res) => {
  try {
    const share = await shareService.accessShare(
      req.params.token,
      req.body.password,
    );
    if (share.resourceType !== "folder") {
      return res
        .status(400)
        .json({ message: "Shared resource is not a folder" });
    }

    const result = await shareService.getSharedFolderFiles(
      share,
      req.params.folderId,
    );

    return res.json({
      folder: result.folder,
      folders: result.folders,
      files: result.files,
    });
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};
