import fileService from "./fileService";

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;

const chunkUploadService = {
  async upload(
    file,
    folderId = null,
    { chunkSize = DEFAULT_CHUNK_SIZE, onProgress, onStatus, signal } = {},
  ) {
    if (!file) {
      throw new Error("File is required");
    }
    if (file.size === 0) {
      throw new Error("Cannot upload an empty file");
    }

    const session = await fileService.initiateChunkUpload(
      file,
      folderId,
      chunkSize,
    );

    const uploadId = session.uploadId;
    if (!uploadId) {
      throw new Error("Upload session was not created");
    }

    /*
     * Lấy trạng thái hiện tại.
     * Nếu đây là Resume Upload thì Backend sẽ trả về những chunk đã nhận.
     */
    const status = await fileService.getChunkUploadStatus(uploadId);
    const totalChunks = status.totalChunks || Math.ceil(file.size / chunkSize);
    const receivedChunks = new Set(status.receivedChunks || []);
    const missingChunks = [];

    for (let index = 0; index < totalChunks; index++) {
      if (!receivedChunks.has(index)) {
        missingChunks.push(index);
      }
    }

    onStatus?.({
      uploadId,
      totalChunks,
      receivedChunks: [...receivedChunks],
      missingChunks,
    });

    let completedChunks = receivedChunks.size;

    // Chỉ upload chunk chưa có. Đây chính là phần Resume.
    for (const chunkIndex of missingChunks) {
      if (signal?.aborted) {
        throw new DOMException("Upload cancelled", "AbortError");
      }

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

    // Tất cả chunk đã có. Yêu cầu Backend merge.
    return await fileService.completeChunkUpload(uploadId);
  },
};

export default chunkUploadService;
