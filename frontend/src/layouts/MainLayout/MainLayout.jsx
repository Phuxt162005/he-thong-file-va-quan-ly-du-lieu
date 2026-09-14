import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import "./MainLayout.css";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="10.8"
        cy="10.8"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="m16 16 4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M10 22h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3.5 7A2.5 2.5 0 0 1 6 4.5h4l2 2h6A2.5 2.5 0 0 1 20.5 9v8A2.5 2.5 0 0 1 18 19.5H6A2.5 2.5 0 0 1 3.5 17V7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 15 15 9M7.5 11.5l-2 2a4 4 0 0 0 5.5 5.5l2-2M16.5 12.5l2-2A4 4 0 0 0 13 5l-2 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5M14 11v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="5"
        y="3.5"
        width="14"
        height="17"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M9 8h6M9 12h6M9 16h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" fill="currentColor" />

      <path d="M5 20c.7-3.5 3.2-5.5 7-5.5s6.3 2 7 5.5" fill="currentColor" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M14 8l4 4-4 4M9 12h9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FolderBrandIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M5 12.5A5.5 5.5 0 0 1 10.5 7H20l4 5h13.5a5.5 5.5 0 0 1 5.5 5.5v16A5.5 5.5 0 0 1 37.5 39h-27A5.5 5.5 0 0 1 5 33.5v-21Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const currentUser = getCurrentUser();

  const username = currentUser?.username || currentUser?.name || "User";

  const avatarLetter = username.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
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
      icon: <HomeIcon />,
    },
    {
      path: "/files",
      label: "Tệp của tôi",
      icon: <FolderIcon />,
    },
    {
      path: "/shares",
      label: "Được chia sẻ",
      icon: <LinkIcon />,
    },
    {
      path: "/trash",
      label: "Thùng rác",
      icon: <TrashIcon />,
    },
    {
      path: "/activities",
      label: "Lịch sử hoạt động",
      icon: <ActivityIcon />,
    },
    {
      path: "/profile",
      label: "Hồ sơ",
      icon: <UserIcon />,
    },
  ];

  return (
    <div className="main-layout">
      {/* =====================================================
          HEADER
          ===================================================== */}
      <header className="main-layout__header">
        <Link
          to="/"
          className="main-layout__brand"
          aria-label="Về trang Tổng quan"
        >
          <span className="main-layout__brand-icon">
            <FolderBrandIcon />
          </span>

          <span className="main-layout__brand-text">
            <strong>File Manager</strong>
            <small>Quản lý file và dữ liệu</small>
          </span>
        </Link>

        <div className="main-layout__header-main">
          <div className="main-layout__search">
            <SearchIcon />

            <input
              type="text"
              placeholder="Tìm kiếm file, thư mục..."
              aria-label="Tìm kiếm file, thư mục"
            />
          </div>

          <div className="main-layout__header-actions">
            <button
              type="button"
              className="main-layout__notification"
              aria-label="Thông báo"
            >
              <BellIcon />
              <span className="main-layout__notification-dot" />
            </button>

            <button
              type="button"
              className="main-layout__user"
              onClick={() => navigate("/profile")}
              aria-label="Mở hồ sơ"
            >
              <span className="main-layout__avatar">{avatarLetter}</span>

              <span className="main-layout__username">{username}</span>

              <span className="main-layout__chevron">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="m7 10 5 5 5-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside className="sidebar">
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
            <span className="sidebar__icon">
              <LogoutIcon />
            </span>

            <span className="sidebar__label">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          CONTENT
          ===================================================== */}
      <main className="main-layout__content">{children}</main>
    </div>
  );
}

/* =========================================================
   LOCAL USER STORAGE
   ========================================================= */
function getCurrentUser() {
  const data = localStorage.getItem("user");

  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
