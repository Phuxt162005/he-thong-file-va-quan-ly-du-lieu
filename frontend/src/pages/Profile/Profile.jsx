import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import FormInput from "../../components/FormInput/FormInput";
import Loading from "../../components/Loading/Loading";
import userService from "../../services/userService";

import { useAuth } from "../../context/AuthContext";

import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const avatarInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await userService.getProfile();
      const data = response?.data || response;

      setUser(data);
      setAvatarPreview(data?.avatar || "");
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

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn một file hình ảnh.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh đại diện không được vượt quá 5 MB.");
      event.target.value = "";
      return;
    }

    const previousAvatar = user?.avatar || "";
    const reader = new FileReader();

    reader.onload = async () => {
      const avatar = String(reader.result || "");
      if (!avatar) {
        setError("Không thể đọc ảnh đại diện.");
        return;
      }

      try {
        setAvatarSaving(true);
        setError("");
        setMessage("");
        setAvatarPreview(avatar);

        const response = await userService.updateProfile({ avatar });
        const data = response?.data || response;

        setUser((prev) => ({ ...prev, ...data }));
        setAvatarPreview(data?.avatar || avatar);
        setMessage("Ảnh đại diện đã được cập nhật.");
      } catch (err) {
        setAvatarPreview(previousAvatar);
        setError(err?.message || "Không thể cập nhật ảnh đại diện.");
      } finally {
        setAvatarSaving(false);
        event.target.value = "";
      }
    };
    reader.onerror = () => {
      setError("Không thể đọc ảnh đại diện.");
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = formData.email.trim();
    if (!email) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email không hợp lệ.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await userService.updateProfile({
        email,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
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

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa tài khoản không?\n\nHành động này không thể hoàn tác.",
    );
    if (!confirmed) {
      return;
    }

    try {
      setDeletingAccount(true);
      setError("");
      setMessage("");
      await userService.deleteAccount();
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err?.message || "Không thể xóa tài khoản.");
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return <Loading message="Đang tải thông tin..." />;
  }

  const displayName =
    formData.firstName || formData.lastName
      ? `${formData.firstName} ${formData.lastName}`.trim()
      : formData.username;

  const avatarLetter = (
    formData.firstName ||
    formData.lastName ||
    formData.username ||
    "U"
  )
    .charAt(0)
    .toUpperCase();

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <h1>Thông tin cá nhân</h1>
        <p>Quản lý thông tin tài khoản của bạn</p>
      </div>

      {error && (
        <div className="profile-message profile-message--error">{error}</div>
      )}

      {message && (
        <div className="profile-message profile-message--success">
          {message}
        </div>
      )}

      <div className="profile-grid">
        {/* =====================================================
            ACCOUNT
            ===================================================== */}
        <section className="profile-panel profile-account">
          <div className="profile-account__avatar-wrap">
            <div className="profile-account__avatar">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Ảnh đại diện" />
              ) : (
                avatarLetter
              )}
            </div>

            <button
              type="button"
              className="profile-account__camera"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarSaving}
              aria-label="Đổi ảnh đại diện"
            >
              <CameraIcon />
            </button>
          </div>

          <div className="profile-account__info">
            <div className="profile-account__top">
              <div>
                <h2>{displayName}</h2>
                <p>{formData.email}</p>
              </div>
            </div>

            <span className="profile-role">
              {user?.role === "admin" ? "Administrator" : "User"}
            </span>

            <div className="profile-joined">
              <CalendarIcon />
              <span>
                Tham gia:{" "}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                  : "--/--/----"}
              </span>
            </div>
          </div>

          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
        </section>

        {/* =====================================================
            STORAGE
            ===================================================== */}
        <StorageQuota />

        {/* =====================================================
            EDIT FORM
            ===================================================== */}
        <section className="profile-panel profile-edit">
          <div className="profile-section-heading">
            <div className="profile-section-icon profile-section-icon--purple">
              <EditSettingsIcon />
            </div>

            <div>
              <h2>Chỉnh sửa thông tin</h2>
              <p>Cập nhật thông tin tài khoản của bạn</p>
            </div>
          </div>

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
                className="profile-button profile-button--secondary"
                onClick={() => navigate("/change-password")}
                disabled={saving}
              >
                <LockIcon />
                Đổi mật khẩu
              </button>

              <button
                type="submit"
                className="profile-button profile-button--primary"
                disabled={saving}
              >
                <SaveIcon />
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </section>

        {/* =====================================================
            SECURITY
            ===================================================== */}
        <section className="profile-panel profile-security">
          <div className="profile-section-heading">
            <div className="profile-section-icon profile-section-icon--blue">
              <ShieldIcon />
            </div>

            <div>
              <h2>Bảo mật tài khoản</h2>
              <p>Quản lý bảo mật và cài đặt tài khoản</p>
            </div>
          </div>

          <div className="profile-security-list">
            <button
              type="button"
              className="profile-security-item profile-security-item--blue"
              onClick={() => navigate("/change-password")}
            >
              <span className="profile-security-item__icon">
                <LockIcon />
              </span>

              <span className="profile-security-item__content">
                <strong>Đổi mật khẩu</strong>
                <small>Cập nhật mật khẩu để bảo vệ tài khoản</small>
              </span>

              <ArrowIcon />
            </button>

            <button
              type="button"
              className="profile-security-item profile-security-item--purple"
              onClick={() => navigate("/notifications")}
            >
              <span className="profile-security-item__icon">
                <BellIcon />
              </span>

              <span className="profile-security-item__content">
                <strong>Thông báo</strong>
                <small>Quản lý cài đặt thông báo</small>
              </span>

              <ArrowIcon />
            </button>

            <button
              type="button"
              className="profile-security-item profile-security-item--danger"
              disabled={deletingAccount}
              onClick={handleDeleteAccount}
            >
              <span className="profile-security-item__icon">
                <TrashIcon />
              </span>

              <span className="profile-security-item__content">
                <strong>Xóa tài khoản</strong>
                <small>
                  {deletingAccount
                    ? "Đang xóa tài khoản..."
                    : "Hành động này không thể hoàn tác"}
                </small>
              </span>

              <ArrowIcon />
            </button>
          </div>
        </section>
      </div>

      {/* =======================================================
          ACCOUNT INFORMATION
          ======================================================= */}
      <section className="profile-account-info">
        <div className="profile-account-info__icon">
          <InfoIcon />
        </div>

        <div>
          <h2>Thông tin tài khoản</h2>
          <p>Tài khoản của bạn đang hoạt động bình thường.</p>
          <p>Hãy giữ an toàn thông tin đăng nhập để bảo vệ dữ liệu của bạn.</p>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   STORAGE
   ============================================================ */

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
      <section className="profile-panel profile-storage">
        <Loading message="Đang tải dung lượng..." />
      </section>
    );
  }

  if (error) {
    return (
      <section className="profile-panel profile-storage">
        <div className="profile-message profile-message--error">{error}</div>
      </section>
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
    <section className="profile-panel profile-storage">
      <div className="profile-section-heading">
        <div className="profile-section-icon profile-section-icon--purple">
          <StorageIcon />
        </div>

        <div>
          <h2>Dung lượng lưu trữ</h2>
          <p>Thông tin sử dụng dung lượng tài khoản</p>
        </div>
      </div>

      <div className="profile-storage__numbers">
        <div>
          <strong>{formatStorage(used)}</strong>
          <span>/ {formatStorage(limit)}</span>
        </div>

        <strong>{safePercentage.toFixed(1)}%</strong>
      </div>

      <div className="profile-storage__progress">
        <div
          className="profile-storage__progress-value"
          style={{ width: `${safePercentage}%` }}
        />
      </div>

      <div className="profile-storage__footer">
        <span>
          <i className="profile-storage__dot profile-storage__dot--used" />
          Đã sử dụng: {formatStorage(used)}
        </span>

        <span>
          <i className="profile-storage__dot profile-storage__dot--remaining" />
          Còn lại: {formatStorage(remaining)}
        </span>
      </div>
    </section>
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

/* ============================================================
   ICONS
   ============================================================ */

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 7h3l1.5-2h5L16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="13"
        r="3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 3v4M16 3v4M4 10h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EditSettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 6h8M5 12h14M5 18h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="6" r="2" fill="currentColor" />
      <circle cx="10" cy="18" r="2" fill="currentColor" />
    </svg>
  );
}

function StorageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <ellipse
        cx="12"
        cy="5"
        rx="7"
        ry="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3 20 6v5c0 5-3.3 8.6-8 10-4.7-1.4-8-5-8-10V6l8-3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m8.5 12 2.3 2.3 4.7-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 4h12l3 3v13H5V4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 4v6h8V4M8 20v-6h8v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 22h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="profile-trash-icon">
      <path
        d="M5 7h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />

      <path
        d="M9 7V4h6v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M7.5 7h9l-1 13h-7l-1-13Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M10 11v5M14 11v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m9 5 7 7-7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 11v6M12 7h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default Profile;
