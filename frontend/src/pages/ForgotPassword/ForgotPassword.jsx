import { useState } from "react";
import { Link } from "react-router-dom";

import AuthLayout from "../../layouts/AuthLayout/AuthLayout";
import FormInput from "../../components/FormInput/FormInput";

import authService from "../../services/authService";

import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");
    if (!email.trimEnd()) {
      setError("Vui lòng nhập email.");
      return;
    }

    try {
      setLoading(true);
      await authService.forgotPassword({ email });
      setMessage("Yêu cầu đặt lại mật  khẩu đã được gửi.");
    } catch (error) {
      setError(err?.message || "Không thể thực hiện yêu cầu.");
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
            <p>Nhập email để yêu cầu đặt lại mật khẩu.</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {message && <div className="success-message">{message}</div>}

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
              {loading ? "Đang xử lý..." : "Gửi yêu cầu"}
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
