import api from "./api";

const folderService = {
  async getFolders(parentFolder = null) {
    const params = {};

    if (parentFolder) {
      params.parentFolder = parentFolder;
    }

    const response = await api.get("/folders", { params });
    return response.data;
  },

  async getFolder(folderId) {
    const response = await api.get(`/folders/${folderId}`);
    return response.data;
  },

  async getDeletedFolders() {
    const response = await api.get("/folders/deleted");
    return response.data;
  },

  async createFolder(name, parentFolder = null) {
    const response = await api.post("/folders", {
      name,
      parentFolder,
    });

    return response.data;
  },

  async renameFolder(folderId, name) {
    const response = await api.put(`/folders/${folderId}`, {
      name,
    });

    return response.data;
  },

  async moveFolder(folderId, destinationFolderId = null) {
    const response = await api.put(`/folders/${folderId}/move`, {
      destinationFolderId,
    });

    return response.data;
  },

  async copyFolder(folderId, destinationFolderId = null) {
    const response = await api.post(`/folders/${folderId}/copy`, {
      destinationFolderId,
    });

    return response.data;
  },

  async deleteFolder(folderId) {
    const response = await api.delete(`/folders/${folderId}`);
    return response.data;
  },

  async restoreFolder(folderId) {
    const response = await api.put(`/folders/${folderId}/restore`);
    return response.data;
  },

  async permanentDelete(folderId) {
    const response = await api.delete(`/folders/${folderId}/permanent`);
    return response.data;
  },
};

export default folderService;
