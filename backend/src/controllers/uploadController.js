const uploadService = require("../services/uploadService");

exports.initiate = async (req, res) => {
  try {
    const result = await uploadService.initiateUpload(req.user.id, req.body);

    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

exports.uploadChunk = async (req, res) => {
  try {
    const chunkIndex = Number(req.headers["x-chunk-index"]);
    const checksum = req.headers["x-chunk-checksum"];

    if (Number.isNaN(chunkIndex)) {
      return res.status(400).json({ message: "Chunk index is required" });
    }

    const result = await uploadService.uploadChunk(
      req.params.uploadId,
      chunkIndex,
      req.body,
      checksum,
    );

    return res.json(result);
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

exports.status = async (req, res) => {
  try {
    const result = await uploadService.getUploadStatus(req.params.uploadId);

    return res.json(result);
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

exports.complete = async (req, res) => {
  try {
    const file = await uploadService.completeUpload(
      req.params.uploadId,
      req.user.id,
    );

    return res.status(201).json({
      message: "Upload completed successfully",
      file,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};
