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

  async refreshToken(refreshToken) {
    const response = await api.post("/auth/refresh", {
      refreshToken,
    });

    return response.data;
  },

  async logout(refreshToken) {
    const response = await api.post("/auth/logout", {
      refreshToken,
    });

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
};

export default authService;
