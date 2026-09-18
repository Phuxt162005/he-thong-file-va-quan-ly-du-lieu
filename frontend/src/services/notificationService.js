import api from "./api";

const notificationService = {
  async getNotifications(options = 50) {
    const params =
      typeof options === "number"
        ? { limit: options }
        : {
            limit: options?.limit ?? 50,
            search: options?.search || undefined,
            from: options?.from || undefined,
            to: options?.to || undefined,
          };
    const response = await api.get("/notifications", { params });
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
