import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import "./MainLayout.css";

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  const menuItems = [
    {
      path: "/",
      label: "Tổng quan",
      icon: "🏠",
    },
    {
      path: "/files",
      label: "Tệp của tôi",
      icon: "📁",
    },
    {
      path: "/shares",
      label: "Được chia sẻ",
      icon: "🔗",
    },
    {
      path: "/trash",
      label: "Thùng rác",
      icon: "🗑️",
    },
    {
      path: "/activities",
      label: "Lịch sử hoạt động",
      icon: "📝",
    },
    {
      path: "/profile",
      label: "Hồ sơ",
      icon: "👤",
    },
  ];

  return (
    <div className="main-layout">
      <header className="main-layout__mobile-header">
        <button
          type="button"
          className="main-layout__menu-button"
          onClick={() => setMobileMenuOpen((value) => !value)}
          aria-label="Mở menu"
          aria-expanded={mobileMenuOpen}
        >
          ☰
        </button>

        <strong>Hệ thống quản lý file</strong>
      </header>

      {mobileMenuOpen && (
        <button
          type="button"
          className="main-layout__mobile-backdrop"
          onClick={closeMobileMenu}
          aria-label="Đóng menu"
        />
      )}

      <aside
        className={`sidebar ${mobileMenuOpen ? "sidebar--mobile-open" : ""}`}
      >
        <Link
          to="/"
          className="sidebar__header"
          onClick={closeMobileMenu}
          aria-label="Về trang Tổng quan"
        >
          <div className="sidebar__brand-icon">📁</div>

          <div className="sidebar__brand-text">
            <strong>File Manager</strong>
            <span>Quản lý dữ liệu</span>
          </div>
        </Link>

        <nav className="sidebar__nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={
                isActive(item.path)
                  ? "sidebar__item sidebar__item--active"
                  : "sidebar__item"
              }
              onClick={closeMobileMenu}
            >
              <span className="sidebar__icon">{item.icon}</span>

              <span className="sidebar__label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar__bottom">
          <button
            type="button"
            className="sidebar__logout"
            onClick={handleLogout}
          >
            <span className="sidebar__icon">🚪</span>
            <span className="sidebar__label">Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className="main-layout__content">{children}</main>
    </div>
  );
}
