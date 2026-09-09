import api from "./api";

const adminService = {
  async getUsers() {
    const response = await api.get("/admin/users");
    return response.data;
  },

  async getUser(userId) {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  async createUser(data) {
    const response = await api.post("/admin/users", data);
    return response.data;
  },

  async updateUser(userId, data) {
    const response = await api.put(`/admin/users/${userId}`, data);
    return response.data;
  },

  async deleteUser(userId) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  async getStorageStats() {
    const response = await api.get("/admin/storage");
    return response.data;
  },

  async getSystemStats() {
    const response = await api.get("/admin/system");
    return response.data;
  },
};

export default adminService;
