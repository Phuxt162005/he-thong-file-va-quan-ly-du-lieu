import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import AuthLayout from "../../layouts/AuthLayout/AuthLayout";
import FormInput from "../../components/FormInput/FormInput";

import authService from "../../services/authService";

import "./ResetPassword.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("Liên kết đặt lại mật khẩu không hợp lệ.");
      return;
    }

    if (!formData.password) {
      setError("Vui lòng nhập mật khẩu mới");
      return;
    }

    if (!formData.password) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword({ token, password: formData.password });
      setMessage("Đặt lại mật khẩu thành công!");
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      setError(err?.message || "Không thể đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="reset-password-page">
        <div className="reset-password-card">
          <div className="reset-password-card__header">
            <h1>Đặt lại mật khẩu</h1>
          </div>

          {error && <div className="error-message">{error}</div>}

          {message && <div className="success-message">{message}</div>}

          <form className="reset-password-form" onSubmit={handleSubmit}>
            <FormInput
              label="Mật khẩu mới"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <FormInput
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>
          </form>

          <div className="reset-password-card__back">
            <Link to="/login">Quay lại đăng nhập</Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
