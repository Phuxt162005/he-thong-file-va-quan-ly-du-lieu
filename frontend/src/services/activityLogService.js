import api from "./api";

const activityLogService = {
  // lấy lịch sử hoạt động của người dùng hiện tại
  async getMyActivities(limit = 100) {
    const response = await api.get("/activities/me", {
      params: { limit },
    });

    return response.data;
  },

  // Admin: lấy các sự kiện bị từ chối
  async getDeniedAuditLogs(limit = 100) {
    const response = await api.get("/audit-logs/denied", {
      params: { limit },
    });

    return response.data;
  },
};

export default activityLogService;
