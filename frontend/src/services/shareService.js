import api from "./api";

const shareService = {
  // tạo link share
  async createShare(data) {
    const response = await api.post("/shares", data);
    return response.data;
  },

  // danh sách Share Link
  async getShares(params = {}) {
    const response = await api.get("/shares", { params });
    return response.data;
  },

  // lấy Share theo ID
  async getShare(shareId) {
    const response = await api.get(`/shares/${shareId}`);
    return response.data;
  },

  // cập nhật Share
  async updateShare(shareId, data) {
    const response = await api.put(`/shares/${shareId}`, data);
    return response.data;
  },

  // thu hồi Share
  async revokeShare(shareId) {
    const response = await api.delete(`/shares/${shareId}`);
    return response.data;
  },

  // truy cập Share
  async accessShare(token, password = null) {
    const response = await api.post(`/shares/access/${token}`, {
      password,
    });
    return response.data;
  },

  // download File được Share trực tiếp
  async downloadSharedFile(token, password = null) {
    const response = await api.post(
      `/shares/download/${token}`,
      { password },
      { responseType: "blob" },
    );
    return response;
  },

  // download File bên trong Shared Folder
  async downloadSharedFolderFile(token, fileId, password = null) {
    const response = await api.post(
      `/shares/folder-download/${token}/${fileId}`,
      { password },
      { responseType: "blob" },
    );
    return response;
  },

  // lấy Shared Folder
  async getSharedFolder(token, password = null) {
    const response = await api.post(`/shares/folder/${token}`, {
      password,
    });
    return response.data;
  },

  // lấy Folder con
  async getSharedFolderChildren(token, folderId, password = null) {
    const response = await api.post(`/shares/folder/${token}/${folderId}`, {
      password,
    });
    return response.data;
  },
};

export default shareService;
