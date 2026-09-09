import { useCallback, useEffect, useMemo, useState } from "react";

import Loading from "../../components/Loading/Loading";
import { useAuth } from "../../context/AuthContext";
import adminService from "../../services/adminService";

import "./Admin.css";

const EMPTY_FORM = {
  username: "",
  email: "",
  password: "",
  role: "user",
  storageLimit: "",
};

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) {
    return "0 B";
  }
  if (value === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${
    units[index]
  }`;
}

function formatDate(date) {
  if (!date) {
    return "-";
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }
  return parsedDate.toLocaleString("vi-VN");
}

function getInitial(user) {
  return (user?.username || user?.email || "U").charAt(0).toUpperCase();
}

function getStoragePercent(used, limit) {
  const usedValue = Number(used) || 0;
  const limitValue = Number(limit) || 0;
  if (limitValue <= 0) {
    return 0;
  }
  return Math.min((usedValue / limitValue) * 100, 100);
}

export default function Admin() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [users, setUsers] = useState([]);
  const [storageStats, setStorageStats] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [statsError, setStatsError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(
    async ({ initial = false } = {}) => {
      if (!isAdmin) {
        setLoading(false);
        return;
      }
      try {
        if (initial) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");
        setStatsError("");

        const [usersResponse, storageResponse, systemResponse] =
          await Promise.all([
            adminService.getUsers(),
            adminService.getStorageStats(),
            adminService.getSystemStats(),
          ]);
        const userData = Array.isArray(usersResponse)
          ? usersResponse
          : usersResponse?.users || usersResponse?.data || [];

        setUsers(Array.isArray(userData) ? userData : []);
        setStorageStats(storageResponse);
        setSystemStats(systemResponse);
      } catch (err) {
        setError(err?.message || "Không thể tải dữ liệu quản trị.");
        setStatsError(err?.message || "Không thể tải thống kê hệ thống.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAdmin],
  );

  useEffect(() => {
    loadData({ initial: true });
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.username?.toLowerCase().includes(keyword) ||
        item.email?.toLowerCase().includes(keyword);
      const matchesRole = roleFilter === "all" || item.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const openCreateForm = () => {
    setEditingUser(null);
    setSelectedUser(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingUser(item);
    setSelectedUser(null);
    setForm({
      username: item.username || "",
      email: item.email || "",
      password: "",
      role: item.role || "user",
      storageLimit:
        item.storageLimit !== undefined ? String(item.storageLimit) : "",
    });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!form.username.trim()) {
      return "Username không được để trống.";
    }
    if (!form.email.trim()) {
      return "Email không được để trống.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Email không hợp lệ.";
    }
    if (!editingUser && form.password.length < 8) {
      return "Mật khẩu phải có ít nhất 8 ký tự.";
    }
    if (
      form.storageLimit !== "" &&
      (!Number.isFinite(Number(form.storageLimit)) ||
        Number(form.storageLimit) < 0)
    ) {
      return "Dung lượng giới hạn không hợp lệ.";
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
      };
      if (form.storageLimit !== "") {
        payload.storageLimit = Number(form.storageLimit);
      }
      if (!editingUser) {
        payload.password = form.password;
      }
      if (editingUser) {
        await adminService.updateUser(editingUser._id, payload);
      } else {
        await adminService.createUser(payload);
      }

      setShowForm(false);
      setEditingUser(null);
      setForm(EMPTY_FORM);
      setFormError("");

      await loadData();
    } catch (err) {
      setFormError(err?.message || "Không thể lưu thông tin người dùng.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) {
      return;
    }
    if (deletingUser._id === user?._id) {
      setDeletingUser(null);
      setError("Không thể xóa tài khoản Admin hiện tại.");
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await adminService.deleteUser(deletingUser._id);
      if (selectedUser?._id === deletingUser._id) {
        setSelectedUser(null);
      }
      setDeletingUser(null);
      await loadData();
    } catch (err) {
      setError(err?.message || "Không thể xóa người dùng.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectUser = async (item) => {
    try {
      setError("");
      const response = await adminService.getUser(item._id);
      setSelectedUser(response?.user || response);
    } catch (err) {
      setError(err?.message || "Không thể tải thông tin người dùng.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <section className="admin-card admin-forbidden">
          <div className="admin-forbidden__icon">🔒</div>
          <h1>Không có quyền truy cập</h1>
          <p>Chức năng quản trị chỉ dành cho tài khoản Admin.</p>
        </section>
      </div>
    );
  }

  if (loading) {
    return <Loading message="Đang tải trang quản trị..." />;
  }

  const totalUsers = systemStats?.users ?? users.length;
  const totalFiles = systemStats?.files ?? 0;
  const totalFolders = systemStats?.folders ?? 0;
  const deletedFiles = systemStats?.deletedFiles ?? 0;
  const deletedFolders = systemStats?.deletedFolders ?? 0;
  const totalStorageLimit = storageStats?.totalStorageLimit ?? 0;
  const totalStorageUsed = storageStats?.totalStorageUsed ?? 0;
  const storagePercent = getStoragePercent(totalStorageUsed, totalStorageLimit);

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1>Quản trị hệ thống</h1>
          <p>Quản lý người dùng và theo dõi trạng thái hệ thống.</p>
        </div>

        <div className="admin-page__actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateForm}
          >
            + Tạo người dùng
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => loadData()}
            disabled={refreshing}
          >
            {refreshing ? "Đang tải..." : "Làm mới"}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* System statistics */}
      <section className="admin-stats">
        <div className="admin-stat-card">
          <span>Tổng người dùng</span>
          <strong>{totalUsers}</strong>
        </div>

        <div className="admin-stat-card">
          <span>File đang hoạt động</span>
          <strong>{totalFiles}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Thư mục đang hoạt động</span>
          <strong>{totalFolders}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Đã xóa</span>
          <strong>{deletedFiles + deletedFolders}</strong>
        </div>
      </section>

      {/* Storage */}
      <section className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2>Dung lượng hệ thống</h2>
            <p>Tổng quan dung lượng được cấp và đã sử dụng.</p>
          </div>

          <strong className="admin-storage-percent">
            {storagePercent.toFixed(1)}%
          </strong>
        </div>

        {statsError ? (
          <div className="error-message">{statsError}</div>
        ) : (
          <>
            <div className="admin-storage-values">
              <div>
                <span>Đã sử dụng</span>
                <strong>{formatBytes(totalStorageUsed)}</strong>
              </div>

              <div>
                <span>Tổng dung lượng</span>
                <strong>{formatBytes(totalStorageLimit)}</strong>
              </div>

              <div>
                <span>Còn lại</span>
                <strong>
                  {formatBytes(storageStats?.availableStorage ?? 0)}
                </strong>
              </div>
            </div>

            <div className="admin-storage-bar">
              <div
                className="admin-storage-bar__fill"
                style={{
                  width: `${storagePercent}%`,
                }}
              />
            </div>
          </>
        )}
      </section>

      {/* User management */}
      <section className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2>Quản lý người dùng</h2>
            <p>Danh sách tài khoản và các thao tác quản trị.</p>
          </div>

          <span className="admin-count">
            {filteredUsers.length} / {users.length}
          </span>
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
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="all">Tất cả role</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="admin-user-list">
          <div className="admin-user-list__header">
            <span>Người dùng</span>
            <span>Email</span>
            <span>Role</span>
            <span>Dung lượng</span>
            <span>Thao tác</span>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="admin-empty">Không tìm thấy người dùng.</div>
          ) : (
            filteredUsers.map((item) => (
              <div className="admin-user-item" key={item._id}>
                <div className="admin-user-item__user">
                  <div className="admin-user-item__avatar">
                    {getInitial(item)}
                  </div>

                  <div>
                    <strong>{item.username || "-"}</strong>

                    <span>ID: {item._id}</span>
                  </div>
                </div>

                <div className="admin-user-item__email">
                  {item.email || "-"}
                </div>

                <div>
                  <span className="admin-role">{item.role || "user"}</span>
                </div>

                <div className="admin-user-storage">
                  <strong>{formatBytes(item.storageUsed)}</strong>

                  <span>/ {formatBytes(item.storageLimit)}</span>
                </div>

                <div className="admin-user-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleSelectUser(item)}
                  >
                    Chi tiết
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => openEditForm(item)}
                  >
                    Sửa
                  </button>

                  {item._id !== user?._id && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => setDeletingUser(item)}
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* User detail */}
      {selectedUser && (
        <section className="admin-card">
          <div className="admin-card__header">
            <div>
              <h2>Thông tin người dùng</h2>
              <p>Chi tiết tài khoản được chọn.</p>
            </div>

            <button
              type="button"
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
              <span>Đã sử dụng</span>
              <strong>{formatBytes(selectedUser.storageUsed)}</strong>
            </div>

            <div>
              <span>Giới hạn lưu trữ</span>
              <strong>{formatBytes(selectedUser.storageLimit)}</strong>
            </div>

            <div>
              <span>Ngày tạo</span>
              <strong>{formatDate(selectedUser.createdAt)}</strong>
            </div>

            <div>
              <span>Cập nhật lần cuối</span>
              <strong>{formatDate(selectedUser.updatedAt)}</strong>
            </div>
          </div>
        </section>
      )}

      {/* Create / edit form */}
      {showForm && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal__header">
              <div>
                <h2>
                  {editingUser ? "Chỉnh sửa người dùng" : "Tạo người dùng"}
                </h2>

                <p>
                  {editingUser
                    ? "Cập nhật thông tin tài khoản."
                    : "Tạo tài khoản mới trong hệ thống."}
                </p>
              </div>

              <button
                type="button"
                className="admin-modal__close"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              {formError && <div className="error-message">{formError}</div>}

              <label>
                Username
                <input
                  className="input"
                  name="username"
                  value={form.username}
                  onChange={handleFormChange}
                  disabled={saving}
                  autoComplete="off"
                />
              </label>

              <label>
                Email
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  disabled={saving}
                  autoComplete="off"
                />
              </label>

              {!editingUser && (
                <label>
                  Mật khẩu
                  <input
                    className="input"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleFormChange}
                    disabled={saving}
                    autoComplete="new-password"
                  />
                </label>
              )}

              <label>
                Role
                <select
                  className="input"
                  name="role"
                  value={form.role}
                  onChange={handleFormChange}
                  disabled={saving}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              <label>
                Storage Limit (bytes)
                <input
                  className="input"
                  type="number"
                  min="0"
                  name="storageLimit"
                  value={form.storageLimit}
                  onChange={handleFormChange}
                  disabled={saving}
                  placeholder="Ví dụ: 5368709120"
                />
              </label>

              <div className="admin-form__actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Đang lưu..."
                    : editingUser
                      ? "Lưu thay đổi"
                      : "Tạo người dùng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deletingUser && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal admin-modal--small">
            <div className="admin-modal__header">
              <div>
                <h2>Xác nhận xóa</h2>
                <p>Bạn có chắc muốn xóa tài khoản này?</p>
              </div>

              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setDeletingUser(null)}
                disabled={deleting}
              >
                ×
              </button>
            </div>

            <div className="admin-delete-warning">
              <strong>{deletingUser.username}</strong>

              <span>{deletingUser.email}</span>

              <p>Thao tác này sẽ xóa tài khoản khỏi hệ thống.</p>
            </div>

            <div className="admin-form__actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingUser(null)}
                disabled={deleting}
              >
                Hủy
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
