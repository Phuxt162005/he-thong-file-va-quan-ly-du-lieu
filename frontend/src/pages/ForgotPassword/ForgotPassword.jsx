import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "../../layouts/AuthLayout/AuthLayout";
import FormInput from "../../components/FormInput/FormInput";

import authService from "../../services/authService";

import "./ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Vui lòng nhập email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Email không hợp lệ.");
      return;
    }

    try {
      setLoading(true);

      const response = await authService.forgotPassword({
        email: normalizedEmail,
      });

      const data = response?.data || response;

      if (!data?.resetToken) {
        throw new Error("Máy chủ không trả về mã đặt lại mật khẩu.");
      }

      navigate(`/reset-password?token=${encodeURIComponent(data.resetToken)}`, {
        replace: true,
        state: {
          email: normalizedEmail,
        },
      });
    } catch (err) {
      if (err?.response?.status === 404) {
        setError("Không tìm thấy tài khoản với email này.");
      } else {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể thực hiện yêu cầu.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="forgot-password-page">
        <div className="forgot-password-card">
          <div className="forgot-password-card__header">
            <h1>Quên mật khẩu</h1>

            <p>Nhập email đã đăng ký để tiếp tục đặt lại mật khẩu.</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form className="forgot-password-form" onSubmit={handleSubmit}>
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              placeholder="Nhập email"
              required
              disabled={loading}
            />

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Đang kiểm tra..." : "Tiếp tục"}
            </button>
          </form>

          <div className="forgot-password-card__back">
            <Link to="/login">Quay lại đăng nhập</Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
