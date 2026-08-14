import { useNavigate } from "react-router-dom";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";

import authService from "../../services/authService";

import { clearAuth } from "../../utils/authStorage";

import "./MainLayout.css";

function MainLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      clearAuth();
      navigate("/login", { replace: true });
    }
  };
  return (
    <div className="main-layout">
      <Header />

      <div className="main-layout__body">
        <Sidebar />

        <main className="main-layout__content">{children}</main>
      </div>

      <button className="btn btn-danger" onClick={handleLogout}>
        Đăng xuất
      </button>
    </div>
  );
}

export default MainLayout;
