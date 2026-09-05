import { createContext, useContext, useEffect, useState } from "react";

import authService from "../services/authService";

import {
  getAccessToken,
  getRefreshToken,
  getCurrentUser,
  setAccessToken,
  setRefreshToken,
  setCurrentUser,
  clearAuth,
} from "../utils/authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getCurrentUser);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(getAccessToken()),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const accessToken = getAccessToken();
    const currentUser = getCurrentUser();

    setIsAuthenticated(Boolean(accessToken));
    setUser(currentUser);
  }, []);

  const login = async (credentials) => {
    setLoading(true);

    try {
      const response = await authService.login(credentials);
      const data = response?.data || response;
      if (!data?.token || !data?.refreshToken) {
        throw new Error("Máy chủ không trả về token đăng nhập.");
      }

      setAccessToken(data.token);
      setRefreshToken(data.refreshToken);

      if (data.user) {
        setCurrentUser(data.user);
        setUser(data.user);
      }
      setIsAuthenticated(true);

      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Dù server logout thất bại vẫn phải xóa session phía client.
    } finally {
      clearAuth();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refresh = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      return null;
    }

    try {
      const response = await authService.refreshToken(refreshToken);
      const data = response?.data || response;
      if (!data?.token) {
        throw new Error("Máy chủ không trả về access token mới.");
      }
      setAccessToken(data.token);
      setIsAuthenticated(true);

      return data.token;
    } catch (error) {
      clearAuth();
      setUser(null);
      setIsAuthenticated(false);

      throw error;
    }
  };

  const value = { user, isAuthenticated, loading, login, logout, refresh };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
