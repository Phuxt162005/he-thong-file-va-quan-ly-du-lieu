import api from "./api";

const fileService = {
  // lấy danh sách file
  async getFiles(folderId = null) {
    const params = {};
    if (folderId) {
      params.folderId = folderId;
    }
    const response = await api.get("/files", { params });
    return response.data;
  },

  // lấy 1 file
  async getFile(fileId) {
    const response = await api.get(`/files/${fileId}`);
    return response.data;
  },

  // upload file
  async uploadFile(file, folderId = null, onProgress) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", file.name);

    if (folderId) {
      formData.append("folderId", folderId);
    }

    const response = await api.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: onProgress,
    });
    return response.data;
  },

  // tải file
  async downloadFile(fileId) {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: "blob",
    });
    return response;
  },

  // xem thông tin file
  async previewFile(fileId) {
    const response = await api.get(`/files/${fileId}/preview`, {
      responseType: "blob",
    });
    return response;
  },

  // đổi tên file
  async renameFile(fileId, name) {
    const response = await api.put(`/files/${fileId}`, { name });
    return response.data;
  },

  // xóa file
  async moveFile(fileId, destinationFolderId) {
    const response = await api.put(`/files/${fileId}/move`, {
      destinationFolderId,
    });
    return response.data;
  },

  // sao chép file
  async copyFile(fileId, destinationFolderId) {
    const response = await api.post(`/files/${fileId}/copy`, {
      destinationFolderId,
    });
    return response.data;
  },

  // xóa file
  async deleteFile(fileId) {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  },

  // xóa vĩnh viễn
  async permanentDelete(fileId) {
    const response = await api.delete(`/files/${fileId}/permanent`);
    return response.data;
  },

  // khôi phục file
  async restoreFile(fileId) {
    const response = await api.put(`/files/${fileId}/restore`);
    return response.data;
  },

  // lấy các file đã bị xóa
  async getDeletedFiles() {
    const response = await api.get("/files/trash");
    return response.data;
  },

  // tạo Upload Session cho Chunk Upload
  async initiateChunkUpload(
    file,
    folderId = null,
    chunkSize = 5 * 1024 * 1024,
  ) {
    const response = await api.post("/files/upload/initiate", {
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      folderId,
      chunkSize,
    });

    return response.data;
  },

  // upload một Chunk
  async uploadChunk(uploadId, chunkIndex, chunk) {
    const response = await api.post(`/files/upload/${uploadId}/chunk`, chunk, {
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Chunk-Index": String(chunkIndex),
      },
      transformRequest: [(data) => data],
    });
    return response.data;
  },

  // lấy trạng thái Upload Session
  async getChunkUploadStatus(uploadId) {
    const response = await api.get(`/files/upload/${uploadId}/status`);
    return response.data;
  },

  // hoàn tất Upload và Merge Chunk
  async completeChunkUpload(uploadId) {
    const response = await api.post(`/files/upload/${uploadId}/complete`);
    return response.data;
  },

  async searchResources(keyword, sortBy = "updatedAt") {
    const response = await api.get("/files/search", {
      params: { q: keyword, sort: sortBy },
    });

    return response.data;
  },

  async getDashboardSummary() {
    const response = await api.get("/files/dashboard-summary");
    return response.data;
  },
};

export default fileService;
