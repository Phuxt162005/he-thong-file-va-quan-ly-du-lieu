import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import fileService from "../../services/fileService";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import userService from "../../services/userService";

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

function formatSearchDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const searchRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(getCurrentUser);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSort, setSearchSort] = useState("updatedAt");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState("");
  const username = currentUser?.username || currentUser?.name || "User";
  const avatarLetter = username.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    let cancelled = false;
    const loadCurrentUser = async () => {
      try {
        const response = await userService.getProfile();
        const user = response?.data || response;
        if (cancelled || !user) {
          return;
        }
        setCurrentUser(user);
        localStorage.setItem("user", JSON.stringify(user));
      } catch {
        // Nếu API lỗi thì giữ user hiện tại trong localStorage.
      }
    };

    const handleUserUpdated = (event) => {
      const updatedUser = event.detail || getCurrentUser();
      if (!updatedUser) {
        return;
      }
      setCurrentUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    };
    loadCurrentUser();
    window.addEventListener("user-profile-updated", handleUserUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("user-profile-updated", handleUserUpdated);
    };
  }, []);

  useEffect(() => {
    const keyword = searchQuery.trim();
    if (!keyword) {
      setSearchResults([]);
      setSearchOpen(false);
      setSearchError("");
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError("");
        setSearchOpen(true);

        const response = await fileService.searchResources(keyword, searchSort);
        if (cancelled) {
          return;
        }

        const results = Array.isArray(response?.results)
          ? response.results
          : [];
        setSearchResults(
          results.filter(
            (item) =>
              item &&
              item._id &&
              (item.resourceType === "file" || item.resourceType === "folder"),
          ),
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSearchResults([]);
        setSearchError(
          error?.response?.data?.message ||
            error?.message ||
            "Không thể tìm kiếm.",
        );
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, searchSort]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!searchRef.current?.contains(event.target)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function handleSearchResultClick(result) {
    if (!result?._id) {
      return;
    }

    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
    setSearchError("");

    if (result.resourceType === "folder") {
      navigate(`/files?folder=${result._id}`);
      return;
    }
    if (result.resourceType === "file") {
      navigate(`/files?preview=${result._id}`);
    }
  }

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
          <div className="main-layout__search-wrapper" ref={searchRef}>
            <div className="main-layout__search">
              <SearchIcon />

              <input
                type="text"
                value={searchQuery}
                placeholder="Tìm kiếm file, thư mục..."
                aria-label="Tìm kiếm file, thư mục"
                onFocus={() => {
                  if (searchQuery.trim()) {
                    setSearchOpen(true);
                  }
                }}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                }}
              />

              {searchQuery && (
                <button
                  type="button"
                  className="main-layout__search-clear"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setSearchOpen(false);
                    setSearchError("");
                  }}
                  aria-label="Xóa tìm kiếm"
                >
                  ×
                </button>
              )}
            </div>

            {searchOpen && (
              <div className="main-layout__search-panel">
                <div className="main-layout__search-controls">
                  <span>Sắp xếp</span>

                  <select
                    value={searchSort}
                    onChange={(event) => {
                      setSearchSort(event.target.value);
                    }}
                    aria-label="Sắp xếp kết quả tìm kiếm"
                  >
                    <option value="updatedAt">Mới chỉnh sửa</option>
                    <option value="createdAt">Mới tải lên</option>
                  </select>
                </div>

                {searchLoading && (
                  <div className="main-layout__search-status">
                    Đang tìm kiếm...
                  </div>
                )}

                {!searchLoading && searchError && (
                  <div className="main-layout__search-status main-layout__search-status--error">
                    {searchError}
                  </div>
                )}

                {!searchLoading &&
                  !searchError &&
                  searchResults.length === 0 && (
                    <div className="main-layout__search-status">
                      Không tìm thấy file hoặc thư mục.
                    </div>
                  )}

                {!searchLoading && !searchError && searchResults.length > 0 && (
                  <div className="main-layout__search-results">
                    {searchResults.map((result) => (
                      <button
                        type="button"
                        key={`${result.resourceType}-${result._id}`}
                        className="main-layout__search-result"
                        onMouseDown={(event) => {
                          event.preventDefault();
                        }}
                        onClick={() => handleSearchResultClick(result)}
                      >
                        <span className="main-layout__search-result-icon">
                          {result.resourceType === "folder" ? "📁" : "📄"}
                        </span>

                        <span className="main-layout__search-result-content">
                          <strong>{result.name}</strong>

                          <small>
                            {result.resourceType === "folder"
                              ? "Thư mục"
                              : result.mimeType || "File"}
                          </small>
                        </span>

                        <span className="main-layout__search-result-date">
                          {formatSearchDate(
                            searchSort === "createdAt"
                              ? result.createdAt
                              : result.updatedAt,
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="main-layout__header-actions">
            <NotificationBell />

            <button
              type="button"
              className="main-layout__user"
              onClick={() => navigate("/profile")}
              aria-label="Mở hồ sơ"
            >
              <span className="main-layout__avatar">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Ảnh đại diện" />
                ) : (
                  avatarLetter
                )}
              </span>

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
