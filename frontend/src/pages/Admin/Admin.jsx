import { useEffect, useState } from "react";

import MainLayout from "../../layouts/MainLayout/MainLayout";
import Loading from "../../components/Loading/Loading";

import api from "../../services/api";

import "./Admin.css";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users");
      const data = response?.data?.data || response?.data || [];

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const keyword = search.trim().toLowerCase();
    const matchesSearch =
      !keyword ||
      user.username?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword);
    const matchesStatus =
      statusFilter === "all" || getUserStatus(user) === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <MainLayout>
        <Loading message="Đang tải trang quản trị..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="admin-page">
        <div className="admin-page__header">
          <div>
            <h1>Quản trị hệ thống</h1>
            <p>Quản lý người dùng và theo dõi hệ thống</p>
          </div>

          <button className="btn btn-secondary" onClick={loadUsers}>
            Làm mới
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Tổng quan */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <span>Tổng người dùng</span>
            <strong>{users.length}</strong>
          </div>

          <div className="admin-stat-card">
            <span>Đang hoạt động</span>
            <strong>
              {users.filter((user) => getUserStatus(user) === "active").length}
            </strong>
          </div>

          <div className="admin-stat-card">
            <span>Bị khóa</span>
            <strong>
              {users.filter((user) => getUserStatus(user) === "locked").length}
            </strong>
          </div>

          <div className="admin-stat-card">
            <span>Admin</span>
            <strong>
              {users.filter((user) => user.role === "admin").length}
            </strong>
          </div>
        </div>

        {/* Quản lý người dùng */}
        <section className="admin-card">
          <div className="admin-card__header">
            <div>
              <h2>Quản lý người dùng</h2>
              <p>Danh sách tài khoản trong hệ thống</p>
            </div>
          </div>

          <div className="admin-toolbar">
            <input
              className="input"
              type="text"
              placeholder="Tìm theo username hoặc email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              className="input"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Bị khóa</option>
            </select>
          </div>

          <div className="admin-user-list">
            <div className="admin-user-list__header">
              <span>Người dùng</span>
              <span>Email</span>
              <span>Role</span>
              <span>Trạng thái</span>
              <span>Thao tác</span>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="admin-empty">Không tìm thấy người dùng.</div>
            ) : (
              filteredUsers.map((user) => (
                <AdminUserItem
                  key={user._id}
                  user={user}
                  onSelect={setSelectedUser}
                />
              ))
            )}
          </div>
        </section>

        {/* Thông tin người dùng */}
        {selectedUser && (
          <section className="admin-card">
            <div className="admin-card__header">
              <div>
                <h2>Thông tin người dùng</h2>
                <p>Chi tiết tài khoản được chọn</p>
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => setSelectedUser(null)}
              >
                Đóng
              </button>
            </div>

            <div className="admin-user-detail">
              <div>
                <span>Username</span>
                <strong>{selectedUser.username || "-"}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong>{selectedUser.email || "-"}</strong>
              </div>

              <div>
                <span>Role</span>
                <strong>{selectedUser.role || "user"}</strong>
              </div>

              <div>
                <span>Trạng thái</span>
                <strong>{getStatusText(getUserStatus(selectedUser))}</strong>
              </div>

              <div>
                <span>Ngày tạo</span>
                <strong>{formatDate(selectedUser.createdAt)}</strong>
              </div>

              <div>
                <span>Đăng nhập gần nhất</span>
                <strong>{formatDate(selectedUser.lastLoginAt)}</strong>
              </div>
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  );
}

function AdminUserItem({ user, onSelect }) {
  const status = getUserStatus(user);

  return (
    <div className="admin-user-item">
      <div className="admin-user-item__user">
        <div className="admin-user-item__avatar">
          {(user.username || user.email || "U").charAt(0).toUpperCase()}
        </div>

        <div>
          <strong>{user.username || "-"}</strong>
          <span>ID: {user._id}</span>
        </div>
      </div>

      <div className="admin-user-item__email">{user.email || "-"}</div>

      <div>
        <span className="admin-role">{user.role || "user"}</span>
      </div>

      <div>
        <span className={`admin-status admin-status--${status}`}>
          {getStatusText(status)}
        </span>
      </div>

      <div>
        <button className="btn btn-secondary" onClick={() => onSelect(user)}>
          Chi tiết
        </button>
      </div>
    </div>
  );
}

function getUserStatus(user) {
  if (user.isLocked === true || user.status === "locked") {
    return "locked";
  }
  return "active";
}

function getStatusText(status) {
  if (status === "locked") {
    return "Bị khóa";
  }
  return "Đang hoạt động";
}

function formatDate(date) {
  if (!date) {
    return "-";
  }
  return new Date(date).toLocaleString("vi-VN");
}
