import fileService from "./fileService";

import {
  createFileKey,
  getUploadSession,
  saveUploadSession,
  removeUploadSession,
} from "./uploadSessionStorage";

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;

const chunkUploadService = {
  async upload(
    file,
    folderId = null,
    { chunkSize = DEFAULT_CHUNK_SIZE, onProgress, onStatus } = {},
  ) {
    if (!file) {
      throw new Error("File is required");
    }
    if (file.size === 0) {
      throw new Error("Cannot upload an empty file");
    }

    const fileKey = createFileKey(file, folderId);
    let savedSession = getUploadSession(fileKey);
    let uploadId = savedSession?.uploadId;

    // Nếu đã có upload session cũ, thử Resume trước.
    if (uploadId) {
      try {
        const status = await fileService.getChunkUploadStatus(uploadId);
        if (status?.status === "completed") {
          removeUploadSession(fileKey);
          uploadId = null;
          savedSession = null;
        } else {
          return await resumeUpload(
            file,
            folderId,
            uploadId,
            status,
            fileKey,
            chunkSize,
            onProgress,
            onStatus,
          );
        }
      } catch {
        // Session cũ không còn tồn tại hoặc đã hết hạn. Tạo session mới.
        removeUploadSession(fileKey);
        uploadId = null;
        savedSession = null;
      }
    }

    // Không có session cũ. Tạo session mới.
    if (!uploadId) {
      const session = await fileService.initiateChunkUpload(
        file,
        folderId,
        chunkSize,
      );
      uploadId = session.uploadId;
      if (!uploadId) {
        throw new Error("Upload session was not created");
      }

      saveUploadSession(fileKey, {
        uploadId,
        fileName: file.name,
        fileSize: file.size,
        lastModified: file.lastModified,
        folderId,
      });

      const status = await fileService.getChunkUploadStatus(uploadId);
      return await resumeUpload(
        file,
        folderId,
        uploadId,
        status,
        fileKey,
        chunkSize,
        onProgress,
        onStatus,
      );
    }
  },
};

async function resumeUpload(
  file,
  folderId,
  uploadId,
  status,
  fileKey,
  chunkSize,
  onProgress,
  onStatus,
) {
  const totalChunks = status.totalChunks || Math.ceil(file.size / chunkSize);
  const receivedChunks = new Set(status.receivedChunks || []);
  const missingChunks = [];

  for (let index = 0; index < totalChunks; index++) {
    if (!receivedChunks.has(index)) {
      missingChunks.push(index);
    }
  }

  let completedChunks = receivedChunks.size;

  onStatus?.({
    uploadId,
    totalChunks,
    receivedChunks: [...receivedChunks],
    missingChunks,
  });

  onProgress?.(Math.round((completedChunks / totalChunks) * 100));

  // Chỉ upload các chunk còn thiếu.
  for (const chunkIndex of missingChunks) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    await fileService.uploadChunk(uploadId, chunkIndex, chunk);
    completedChunks++;
    const progress = Math.round((completedChunks / totalChunks) * 100);
    onProgress?.(progress);
    onStatus?.({
      uploadId,
      totalChunks,
      receivedChunks: completedChunks,
      missingChunks: totalChunks - completedChunks,
    });
  }

  // Tất cả chunk đã upload. Yêu cầu Backend merge.
  const result = await fileService.completeChunkUpload(uploadId);
  // Upload thành công thì xóa session khỏi localStorage.
  removeUploadSession(fileKey);
  return result;
}

export default chunkUploadService;
