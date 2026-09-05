import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import FormInput from "../../components/FormInput/FormInput";
import Loading from "../../components/Loading/Loading";

import userService from "../../services/userService";

import "./Profile.css";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
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
        firstName: data?.firstName || "",
        lastName: data?.lastName || "",
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
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      const data = response?.data || response;

      setUser((prev) => ({ ...prev, ...data }));
      setFormData((prev) => ({
        ...prev,
        email: data?.email ?? prev.email,
        firstName: data?.firstName ?? prev.firstName,
        lastName: data?.lastName ?? prev.lastName,
      }));

      setMessage("Cập nhật thông tin thành công.");
    } catch (err) {
      setError(err?.message || "Không thể cập nhật thông tin.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading message="Đang tải thông tin..." />;
  }

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <h1>Thông tin cá nhân</h1>
        <p>Quản lý thông tin tài khoản của bạn</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {message && <div className="success-message">{message}</div>}

      <div className="profile-layout">
        <div className="profile-card">
          <div className="profile-card__avatar">
            {(
              formData.firstName ||
              formData.lastName ||
              formData.username ||
              "U"
            )
              .charAt(0)
              .toUpperCase()}
          </div>

          <h2>
            {formData.firstName || formData.lastName
              ? `${formData.firstName} ${formData.lastName}`.trim()
              : formData.username}
          </h2>

          <p>{formData.email}</p>

          {user?.role && (
            <span className="profile-card__role">
              {user.role === "admin" ? "Administrator" : "User"}
            </span>
          )}
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
              label="Tên"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Nhập tên"
              disabled={saving}
            />

            <FormInput
              label="Họ"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Nhập họ"
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
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/change-password")}
                disabled={saving}
              >
                Đổi mật khẩu
              </button>

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

      <StorageQuota />
    </div>
  );
}

function StorageQuota() {
  const [storage, setStorage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStorage();
  }, []);

  const loadStorage = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await userService.getStorageQuota();
      const data = response?.data || response;

      setStorage(data);
    } catch (err) {
      setError(err?.message || "Không thể tải thông tin dung lượng.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-card storage-card">
        <Loading message="Đang tải dung lượng..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-card storage-card">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const used = Number(storage?.storageUsed || 0);
  const limit = Number(storage?.storageLimit || 0);
  const remaining = Number(
    storage?.storageRemaining ?? Math.max(limit - used, 0),
  );

  const percentage =
    Number(storage?.usagePercent) || (limit > 0 ? (used / limit) * 100 : 0);

  const safePercentage = Math.min(Math.max(percentage, 0), 100);

  let quotaStatus = "Bình thường";

  if (safePercentage >= 100) {
    quotaStatus = "Đã đầy dung lượng";
  } else if (safePercentage >= 90) {
    quotaStatus = "Sắp đầy dung lượng";
  }

  return (
    <div className="profile-card storage-card">
      <div className="storage-card__header">
        <div>
          <h2>Dung lượng lưu trữ</h2>
          <p>Thông tin sử dụng dung lượng tài khoản</p>
        </div>

        <span>
          {formatStorage(used)} / {formatStorage(limit)}
        </span>
      </div>

      <div className="storage-card__progress">
        <div
          className="storage-card__progress-value"
          style={{
            width: `${safePercentage}%`,
          }}
        />
      </div>

      <div className="storage-card__footer">
        <span>Đã sử dụng {safePercentage.toFixed(1)}%</span>

        <span>Còn lại {formatStorage(remaining)}</span>
      </div>

      <div className="storage-card__status">{quotaStatus}</div>
    </div>
  );
}

function formatStorage(bytes) {
  if (!bytes || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(2)} ${units[index]}`;
}

export default Profile;
