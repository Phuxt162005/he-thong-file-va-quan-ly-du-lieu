import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "../../layouts/AuthLayout/AuthLayout";
import FormInput from "../../components/FormInput/FormInput";

import authService from "../../services/authService";

import "./Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
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
      setError("vui lòng nhập tên đăng nhập.");
      return;
    }
    if (!formData.password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

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
      setLoading(true);
      setError("");
      await authService.register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate("/login");
    } catch (err) {
      setError(err?.message || "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="register-page">
        <div className="register-card">
          <div className="register-car__header">
            <h1>Đăng ký</h1>
            <p>Tạo tài khoản mới</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form className="register-form" onSubmit={handleSubmit}>
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
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email"
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

            <FormInput
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu"
              required
              disabled={loading}
            />

            <button
              type="submit"
              className="btn btn-primary register-form__submit"
              disabled={loading}
            >
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </form>

          <div className="register-card__login">
            <span>Đã có tài khoản?</span>
            <Link to="/login">Đăng nhập</Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
