import { apiRequest } from "./api";

// lấy danh sách thư mục con
export function getDefaultResultOrder(parentId) {
  return apiRequest(`/folders?parentId=${parentId || ""}`);
}

// tạo thư mục
export function createFolder(name, parentId) {
  return apiRequest("/folders", {
    method: "POST",
    body: JSON.stringify({ name, parentId }),
  });
}
