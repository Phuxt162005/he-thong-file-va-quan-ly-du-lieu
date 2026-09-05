import axios from "axios";

import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  clearAuth,
} from "../utils/authStorage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const onRefreshFailed = () => {
  refreshSubscribers.forEach((callback) => callback(null));
  refreshSubscribers = [];
};

const redirectToLogin = () => {
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      error.message = "Không thể kết nối đến máy chủ.";
      return Promise.reject(error);
    }

    const status = error.response.status;

    /*
     * Không refresh nếu:
     * - request đã retry
     * - chính request refresh bị lỗi
     * - đang ở login
     */
    const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");
    const isLoginRequest = originalRequest?.url?.includes("/auth/login");

    if (
      status === 401 &&
      !originalRequest?._retry &&
      !isRefreshRequest &&
      !isLoginRequest
    ) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAuth();
        redirectToLogin();

        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (!newToken) {
              reject(error);
              return;
            }
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } },
        );

        const newToken = response.data?.token;
        if (!newToken) {
          throw new Error(
            "Refresh token response does not contain access token",
          );
        }

        setAccessToken(newToken);
        isRefreshing = false;
        onRefreshed(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshFailed();
        clearAuth();
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

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
