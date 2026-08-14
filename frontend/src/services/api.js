import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8081/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem("accessToken");
    }

    const message = error?.response?.data?.message || "Có lỗi xảy ra!";

    return Promise.reject(new Error(message));
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (!error.response) {
      error.message = "Không thể kết nối đến máy chủ.";
    }

    if (error.response?.status === 401) {
      response.message = "Phiên đăng nhập đã hết hạn.";
    }

    if (error.response?.status === 403) {
      error.message = "Bạn không có quyền thực hiện thao tác này.";
    }

    if (error.response?.status === 404) {
      error.message = "Không tìm thấy tài nguyên.";
    }

    if (error.response?.status === 409) {
      error.message = "Dữ liệu đã tồn tại hoặc bị xung đột.";
    }

    if (error.response?.status >= 500) {
      error.message = "Máy chủ đang gặp sự cố.";
    }

    return Promise.reject(error);
  },
);

export default api;
