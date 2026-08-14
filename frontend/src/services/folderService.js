import api from "./api";

const folderService = {
  // lấy folder cha
  async getFolder(parentFolder = null) {
    const params = {};

    if (parentFolder) {
      params.parentFolder = parentFolder;
    }

    const response = await api.get("/folders", { params });
    return response.data;
  },

  // lấy các folder con
  async getFolder(folderId) {
    const response = await api.get(`/folders/${folderId}`);
    return response.data;
  },

  // tạo folder mới
  async createFolder(data) {
    const response = await api.post("/folders", data);
    return response.data;
  },

  // xóa folder
  async removeFolder(folderId, name) {
    const response = await api.put(`/folders/${folderId}`, { name });
    return response.data;
  },

  // di chuyển folder
  async moveFolder(folderId, destinationFolderId) {
    const response = await api.put(`/folders/${folderId}/move`, {
      destinationFolderId,
    });
    return response.data;
  },

  // sao chép folder
  async copyFolder(folderId, destinationFolderId) {
    const response = await api.post(`/folders/${folderId}/copy`, {
      destinationFolderId,
    });
    return response.data;
  },

  // xóa folder
  async deleteFolder(folderId) {
    const response = await api.delete(`/folders/${folderId}`);
    return response.data;
  },

  // lưu folder
  async restoreFolder(folderId) {
    const response = await api.put(`/folders/${folderId}/restore`);
    return response.data;
  },
};

export default folderService;
