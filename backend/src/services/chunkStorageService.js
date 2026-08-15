const fs = require("fs");
const path = require("path");
const CHUNK_ROOT = path.join(process.cwd(), "storage", "chunks");

function getUploadDirectory(uploadId) {
  return path.join(CHUNK_ROOT, uploadId.toString());
}

exports.ensureUploadDirectory = (uploadId) => {
  const directory = getUploadDirectory(uploadId);
  fs.mkdirSync(directory, { recursive: true });
  return directory;
};

exports.getChunkPath = (uploadId, chunkIndex) => {
  return path.join(getUploadDirectory(uploadId), `${chunkIndex}.chunk`);
};

exports.writeChunk = (uploadId, chunkIndex, buffer) => {
  const directory = exports.ensureUploadDirectory(uploadId);
  const chunkPath = path.join(directory, `${chunkIndex}.chunk`);
  fs.writeFileSync(chunkPath, buffer);
  return chunkPath;
};

exports.chunkExists = (uploadId, chunkIndex) => {
  return fs.existsSync(exports.getChunkPath(uploadId, chunkIndex));
};

exports.getChunkSize = (uploadId, chunkIndex) => {
  const chunkPath = exports.getChunkPath(uploadId, chunkIndex);
  if (!fs.existsSync(chunkPath)) {
    return 0;
  }
  return fs.statSync(chunkPath).size;
};

exports.getReceivedChunks = (uploadId, totalChunks) => {
  const received = [];
  for (let i = 0; i < totalChunks; i++) {
    if (exports.chunkExists(uploadId, i)) {
      received.push(i);
    }
  }
  return received;
};

exports.deleteUploadDirectory = (uploadId) => {
  const directory = getUploadDirectory(uploadId);
  if (fs.existsSync(directory)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
};

exports.mergeChunks = (uploadId, totalChunks, outputPath) => {
  const outputDirectory = path.dirname(outputPath);

  fs.mkdirSync(outputDirectory, { recursive: true });

  //   xóa file cũ nếu tồn tại
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  // ghép chunk
  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = exports.getChunkPath(uploadId, i);
    // nếu thiếu 1 chunk thì không merge
    if (!fs.existsSync(chunkPath)) {
      throw new Error(`Chunk ${i} is missing.`);
    }
    const chunk = fs.readFileSync(chunkPath);
    fs.appendFileSync(outputPath, chunk);
  }
};
