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

export default api;
