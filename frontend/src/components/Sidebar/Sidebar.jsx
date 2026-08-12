import { NavLink } from "react-router-dom";

import "./Sidebar.css";

export default function Sidebar() {
  const menuItems = [
    { path: "/files", label: "Tệp của tôi", icon: "📁" },
    { path: "/shares", label: "Đã chia sẻ", icon: "🔗" },
    { path: "/trash", label: "Thùng rác", icon: "🗑️" },
    { path: "/profile", label: "Thông tin cá nhân", icon: "👤" },
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "sidebar__item sidebar__item--active" : "sidebar__item"
            }
          >
            <span className="sidebar__icon">{item.icon}</span>
            <span className="sidebar__label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive ? "sidebar__item sidebar__item--active" : "sidebar__item"
          }
        >
          <span className="sidebar__icon">⚙️</span>
          <span className="sidebar__label">Cài đặt</span>
        </NavLink>
      </div>
    </aside>
  );
}
