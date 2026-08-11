import { apiRequest } from "./api";

// lấy danh sách file
export function getFiles(folderId) {
  return apiRequest(`/files?folderId=${folderId || ""}`);
}

// xóa file
export function deleteFile(fileId) {
  return apiRequest(`/files/${fileId}`, {
    method: "DELETE",
  });
}
