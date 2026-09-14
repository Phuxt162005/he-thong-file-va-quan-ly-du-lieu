import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import FormInput from "../../components/FormInput/FormInput";

import authService from "../../services/authService";
import {
  setAccessToken,
  setRefreshToken,
  setCurrentUser,
} from "../../utils/authStorage";

import "./Login.css";

function FolderIcon() {
  return (
    <svg className="login-brand__icon" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="folderGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6d8cff" />
          <stop offset="100%" stopColor="#3f9cf5" />
        </linearGradient>
      </defs>

      <path
        d="M7 18.5C7 14.91 9.91 12 13.5 12H27l6 7h17.5c3.59 0 6.5 2.91 6.5 6.5v20C57 49.09 54.09 52 50.5 52h-37C9.91 52 7 49.09 7 45.5v-27Z"
        fill="url(#folderGradient)"
      />

      <path
        d="M7 24.5C7 21.46 9.46 19 12.5 19h39c3.59 0 6.5 2.91 6.5 6.5v20C58 49.09 55.09 52 51.5 52h-38C9.91 52 7 49.09 7 45.5v-21Z"
        fill="#4d9cf5"
        opacity="0.9"
      />

      <path
        d="M9 25h47v20.5c0 3.59-2.91 6.5-6.5 6.5h-37C9.91 52 7 49.09 7 45.5V27c0-1.1.9-2 2-2Z"
        fill="url(#folderGradient)"
      />
    </svg>
  );
}

function LoginArrowIcon() {
  return (
    <svg className="login-submit__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 17l5-5-5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M15 12H4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M20 5v14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.username.trim() || !formData.password) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await authService.login({
        username: formData.username.trim(),
        password: formData.password,
      });

      const data = response?.data || response;

      if (!data?.token || !data?.refreshToken) {
        throw new Error(
          "Đăng nhập thành công nhưng máy chủ không trả về token.",
        );
      }

      setAccessToken(data.token);
      setRefreshToken(data.refreshToken);

      if (data.user) {
        setCurrentUser(data.user);
      }

      const redirectPath = location.state?.from || "/files";

      navigate(redirectPath, {
        replace: true,
      });
    } catch (err) {
      if (err?.response?.status === 401) {
        setError("Tên đăng nhập hoặc mật khẩu không chính xác.");
      } else if (err?.response?.status === 403) {
        setError("Tài khoản đã bị khóa.");
      } else {
        setError(err?.message || "Không thể đăng nhập. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-card__header">
          <div className="login-brand">
            <FolderIcon />
          </div>

          <h1>File Manager</h1>

          <p>Quản lý file và dữ liệu của bạn</p>
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <FormInput
            variant="login"
            label="Tên đăng nhập"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Nhập tên đăng nhập"
            disabled={loading}
            required
          />

          <FormInput
            variant="login"
            label="Mật khẩu"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Nhập mật khẩu"
            disabled={loading}
            required
          />

          <div className="auth-form__forgot">
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>

          <button
            className="auth-form__submit"
            type="submit"
            disabled={loading}
          >
            <LoginArrowIcon />

            <span>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</span>
          </button>
        </form>

        <div className="auth-card__footer">
          <span>Chưa có tài khoản?</span>

          <Link to="/register">Đăng ký</Link>
        </div>
      </section>
    </main>
  );
}
