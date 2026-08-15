import api from "./api";

const permissionService = {
  // lấy danh sách quyền của File/Folder
  async getPermissions(resourceType, resourceId) {
    const response = await api.get(
      `/permissions/resource/${resourceType}/${resourceId}`,
    );
    return response.data;
  },

  // cấp quyền cho User
  async grantPermission(userId, resourceId, resourceType, permissions) {
    const response = await api.post("/permissions", {
      userId,
      resourceId,
      resourceType,
      permissions,
    });

    return response.data;
  },

  // cập nhật quyền
  async updatePermission(permissionId, permissions) {
    const response = await api.put(`/permissions/${permissionId}`, {
      permissions,
    });
    return response.data;
  },

  // thu hồi quyền
  async revokePermission(permissionId) {
    const response = await api.delete(`/permissions/${permissionId}`);
    return response.data;
  },
};

export default permissionService;
