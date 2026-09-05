import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
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
  (error) => {
    if (!error.response) {
      error.message = "Không thể kết nối đến máy chủ.";
      return Promise.reject(error);
    }

    const status = error.response.status;

    if (status === 401) {
      error.message = "Phiên đăng nhập đã hết hạn.";
    } else if (status === 403) {
      error.message = "Bạn không có quyền thực hiện thao tác này.";
    } else if (status === 404) {
      error.message = "Không tìm thấy tài nguyên.";
    } else if (status === 409) {
      error.message = "Dữ liệu đã tồn tại hoặc bị xung đột.";
    } else if (status === 413) {
      error.message = "Dữ liệu gửi lên quá lớn.";
    } else if (status === 429) {
      error.message = "Bạn thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau.";
    } else if (status >= 500) {
      error.message = "Máy chủ đang gặp sự cố.";
    } else {
      error.message = error.response.data?.message || "Có lỗi xảy ra!";
    }

    return Promise.reject(error);
  },
);

export default api;
