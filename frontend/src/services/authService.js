import api from "./api";

const authService = {
  async login(data) {
    const response = await api.post("/auth/login", data);
    return response.data;
  },
  async register(data) {
    const response = await api.post("/auth/register", data);
    return response.data;
  },
  async refreshToken() {
    const response = await api.post("/auth/refresh");
    return response.data;
  },
  async forgotPassword(data) {
    const response = await api.post("/auth/forgot-password", data);
    return response.data;
  },
  async resetPassword(data) {
    const response = await api.post("/auth/reset-password", data);
    return response.data;
  },
  async changePassword(data) {
    const response = await api.put("/auth/change-password", data);
    return response.data;
  },
  async logout() {
    const response = await api.post("/auth/logout");
    localStorage.removeItem("accessToken");
    return response.data;
  },
};

export default authService;
