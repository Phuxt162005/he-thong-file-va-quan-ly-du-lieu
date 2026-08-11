import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Dashboard from "../pages/Dashboard/Dashboard";
import Profile from "../pages/Profile/Profile";
import Files from "../pages/Files/Files";
import Shares from "../pages/Shares/Shares";

import MainLayout from "../layouts/MainLayout/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* không yêu cầu đăng nhập */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* yêu cầu đăng nhập */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/files"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Files />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/shares"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Shares />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* URL không tồn tại */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
