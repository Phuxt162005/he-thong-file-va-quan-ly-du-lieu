import { useActionState, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleProfile = () => {
    setShowMenu(false);
    navigate("/profile");
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setShowMenu(false);
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header__left">
        <div className="header__logo" onClick={() => navigate("/")}>
          File manager
        </div>
      </div>

      <div className="header_center">
        <div className="header_search">
          <input
            type="text"
            className="input"
            placeholder="Tìm kiếm file và thư mục..."
          />

          <button className="header_search-button">🔍 Tìm kiếm</button>
        </div>
      </div>

      <div className="header__right">
        <button className="header_notification">🔔</button>
        <div className="header__user">
          <button
            className="header__user-button"
            onClick={() => setShowMenu(!showMenu)}
          >
            <span className="header__avatar">U</span>
            <span className="header__username">User</span>
            <span>▾</span>
          </button>

          {showMenu && (
            <div className="header__menu">
              <button onClick={handleProfile}>Thông tin cá nhân</button>
              <button onClick={() => navigate("/change-password")}>
                Đổi mật khẩu
              </button>
              <button className="header__menu-danger" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
