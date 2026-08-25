const shareService = require("../services/shareService");
const File = require("../models/File");
const Folder = require("../models/Folder");

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
      req.params.token,
      req.body.password,
    );

    let resource;

    if (share.resourceType === "file") {
      resource = await File.findById(share.resourceId);
    } else {
      resource = await Folder.findById(share.resourceId);
    }

    if (!resource) {
      return res.status(404).json({ message: "Shared resource not found" });
    }

    return res.json({
      resourceId: share.resourceId,
      resourceType: share.resourceType,
      name: resource.name || resource.fileName || "Tài nguyên được chia sẻ",
      expiresAt: share.expiresAt,
      maxDownloads: share.maxDownloads,
      downloadCount: share.downloadCount,
      isActive: share.isActive,
    });
  } catch (err) {
    return res.status(403).json({ message: err.message });
  }
};

// download
exports.download = async (req, res) => {
  try {
    const share = await shareService.accessShare(
      req.params.token,
      req.body.password,
    );
    if (share.resourceType !== "file") {
      return res
        .status(400)
        .json({ message: "This endpoint only supports shared files" });
    }

    const result = await shareService.getSharedFile(share);

    res.download(result.filePath, result.file.name, async (error) => {
      if (error) {
        return;
      }

      try {
        await shareService.completeSharedDownload(share._id);
      } catch (downloadError) {
        console.error("Failed to update download count:", downloadError);
      }
    });
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};

// folder cha
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

// folder con
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

// vô hiệu hóa Share Link
exports.disable = async (req, res) => {
  try {
    const share = await shareService.disableShare(req.user.id, req.params.id);

    return res.json({
      message: "Share link disabled successfully",
      share,
    });
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};

// danh sách Share Link của User
exports.list = async (req, res) => {
  try {
    const shares = await shareService.getMyShares(
      req.user.id,
      req.query.status,
    );

    return res.json(shares);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// update share link
exports.update = async (req, res) => {
  try {
    const share = await shareService.updateShare(
      req.user.id,
      req.params.id,
      req.body,
    );

    return res.json(share);
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};

exports.get = async (req, res) => {
  try {
    const share = await shareService.getShare(req.user.id, req.params.id);

    return res.json(share);
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};

// download file bên trong Folder được share
exports.folderDownload = async (req, res) => {
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

    const result = await shareService.getSharedFolderFile(
      share,
      req.params.fileId,
    );

    res.download(result.filePath, result.file.name, async (error) => {
      if (error) {
        return;
      }

      try {
        await shareService.completeSharedDownload(share._id);
      } catch (downloadError) {
        console.error("Failed to update download count:", downloadError);
      }
    });
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
};
