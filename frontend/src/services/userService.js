import apiRequest, { apiRoutes } from "./api";

// lấy thông tin cá nhân
export function getProfile() {
  return apiRequest("/users/profile");
}

// cập nhật thông tin
export function updateProfile(data) {
  return apiRequest("/users/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
