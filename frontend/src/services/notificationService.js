import api from "./api";

const notificationService = {
  async getNotifications(limit = 50) {
    const response = await api.get("/notifications", {
      params: { limit },
    });

    return response.data;
  },

  async markRead(id) {
    const response = await api.patch(`/notifications/${id}/read`);

    return response.data;
  },

  async markAllRead() {
    const response = await api.patch("/notifications/read-all");

    return response.data;
  },
};

export default notificationService;
