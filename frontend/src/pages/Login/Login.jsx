import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "../../layouts/AuthLayout/AuthLayout";
import FormInput from "../../components/FormInput/FormInput";
import authService from "../../services/auth.service";

import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.username.trim()) {
      setError("Vui lòng nhập tên đăng nhập.");
      return;
    }

    if (!formData.password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await authService.login(formData);
      if (response?.accessToken) {
        localStorage.setItem("accessToken", response.accessToken);
      }

      navigate("/files");
    } catch (err) {
      setError(err?.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="login-page">
        <div className="login-card">
          <div className="login-card__header">
            <h1>Đăng nhập</h1>

            <p>Đăng nhập vào hệ thống quản lý file</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <FormInput
              label="Tên đăng nhập"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Nhập tên đăng nhập"
              required
              disabled={loading}
            />

            <FormInput
              label="Mật khẩu"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              required
              disabled={loading}
            />

            <div className="login-form__forgot">
              <Link to="/forgot-password">Quên mật khẩu?</Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-form__submit"
              disabled={loading}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="login-card__register">
            <span>Chưa có tài khoản?</span>

            <Link to="/register">Đăng ký</Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
