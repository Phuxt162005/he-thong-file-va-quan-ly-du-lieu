import { Link, useNavigate } from "react-router-dom";

import authService from "../../services/authService";
import { clearAuth } from "../../utils/authStorage";
import { useAuth } from "../../context/AuthContext";

import "./MainLayout.css";

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="main-layout">
      {/* Sidebar */}

      <aside className="sidebar">
        <div className="sidebar__header">
          <h2>Tệp của tôi</h2>
        </div>

        <nav className="sidebar-menu">
          <Link to="/" className="sidebar-menu__item">
            <span>🏠</span>
            <span>Tổng quan</span>
          </Link>

          <Link to="/files" className="sidebar-menu__item">
            <span>📁</span>
            <span>Tệp của tôi</span>
          </Link>

          <Link to="/shares" className="sidebar-menu__item">
            <span>🔗</span>
            <span>Được chia sẻ</span>
          </Link>

          <Link to="/trash" className="sidebar-menu__item">
            <span>🗑️</span>
            <span>Thùng rác</span>
          </Link>

          <Link to="/profile" className="sidebar-menu__item">
            <span>👤</span>
            <span>Hồ sơ</span>
          </Link>
        </nav>

        <div className="sidebar__footer">
          <button className="btn btn-danger" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Nội dung chính */}

      <main className="main-layout__content">{children}</main>
    </div>
  );
}
