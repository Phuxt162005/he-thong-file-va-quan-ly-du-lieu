import { useEffect, useState } from "react";

import MainLayout from "../../layouts/MainLayout/MainLayout";
import FormInput from "../../components/FormInput/FormInput";
import Loading from "../../components/Loading/Loading";

import userService from "../../services/userService";

import "./Profile.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await userService.getProfile();
      const data = response?.data || response;

      setUser(data);
      setFormData({
        username: data?.username || "",
        email: data?.email || "",
        fullName: data?.fullName || "",
      });
    } catch (err) {
      setError(err?.message || "Không thể tải thông tin người dùng.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await userService.updateProfile({
        email: formData.email,
        fullName: formData.fullName,
      });
      const data = response?.data || response;

      setUser((prev) => ({ ...prev, ...data }));
      setMessage("Cập nhật thông tin thành công.");
    } catch (err) {
      setError(err?.message || "Không thể cập nhật thông tin.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Loading message="Đang tải thông tin..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="profile-page">
        <div className="profile-page__header">
          <h1>Thông tin cá nhân</h1>

          <p>Quản lý thông tin tài khoản</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {message && <div className="success-message">{message}</div>}

        <div className="profile-layout">
          <div className="profile-card">
            <div className="profile-card__avatar">
              {(formData.fullName || formData.username || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <h2>{formData.fullName || formData.username}</h2>

            <p>{formData.email}</p>
          </div>

          <div className="profile-card profile-card--form">
            <form className="profile-form" onSubmit={handleSubmit}>
              <FormInput
                label="Tên đăng nhập"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled
              />

              <FormInput
                label="Họ và tên"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nhập họ và tên"
                disabled={saving}
              />

              <FormInput
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập email"
                disabled={saving}
              />

              <div className="profile-form__actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
        <StorageQuota user={user} />
      </div>
    </MainLayout>
  );
}

function StorageQuota({ user }) {
  const used = Number(user?.storageUsed || 0);
  const quota = Number(user?.storageQuota || 0);
  const percentage = quota > 0 ? Math.min((used / quota) * 100, 100) : 0;

  return (
    <div className="profile-card storage-card">
      <div className="storage-card__header">
        <div>
          <h2>Dung lượng lưu trữ</h2>

          <p>Dung lượng đã sử dụng</p>
        </div>

        <span>
          {formatStorage(used)}
          {" / "}
          {formatStorage(quota)}
        </span>
      </div>

      <div className="storage-card__progress">
        <div
          className="storage-card__progress-value"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <div className="storage-card__footer">
        <span>Đã sử dụng {percentage.toFixed(1)}%</span>

        <span>Còn lại {formatStorage(Math.max(quota - used, 0))}</span>
      </div>
    </div>
  );
}

function formatStorage(bytes) {
  if (!bytes || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(2)} ${units[index]}`;
}

export default Profile;
