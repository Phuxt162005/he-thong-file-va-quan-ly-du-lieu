import api from "./api";

const shareService = {
  // tạo link share
  async createShare(data) {
    const response = await api.post("/shares", data);
    return response.data;
  },

  async getShares(params = {}) {
    const response = await api.get("/shares", { params });
    return response.data;
  },

  async getShare(shareId) {
    const response = await api.get(`/shares/${shareId}`);
    return response.data;
  },

  // cập nhật link share
  async updateShare(shareId, data) {
    const response = await api.put(`/shares/${shareId}`, data);
    return response.data;
  },

  async revokeShare(shareId) {
    const response = await api.delete(`/shares/${shareId}`);
    return response.data;
  },

  async accessShare(token, password = null) {
    const response = await api.post(`/shares/access/${token}`, { password });
    return response.data;
  },

  async previewSharedFile(token, password = null) {
    const response = await api.post(
      `/shares/access/${token}/preview`,
      { password },
      { responseType: "blob" },
    );
    return response;
  },

  async downloadSharedFile(token, password = null) {
    const response = await api.post(
      `/shares/access/${token}/download`,
      { password },
      { responseType: "blob" },
    );
    return response;
  },
};

export default shareService;
