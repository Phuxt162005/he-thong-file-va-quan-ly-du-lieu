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

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

      navigate(redirectPath, { replace: true });
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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1>Đăng nhập</h1>

          <p>Đăng nhập vào hệ thống</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <FormInput
            label="Tên đăng nhập"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Nhập tên đăng nhập"
            disabled={loading}
            required
          />

          <FormInput
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
            className="btn btn-primary auth-form__submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="auth-card__footer">
          <span>Chưa có tài khoản?</span>

          <Link to="/register">Đăng ký</Link>
        </div>
      </div>
    </div>
  );
}
