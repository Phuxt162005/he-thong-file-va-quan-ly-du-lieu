import api from "./api";

const userService = {
  async getProfile() {
    const response = await api.get("/users/profile");
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.put("/users/profile", data);
    return response.data;
  },

  async getStorageQuota() {
    const response = await api.get("/users/storage");
    return response.data;
  },
};

export default userService;
