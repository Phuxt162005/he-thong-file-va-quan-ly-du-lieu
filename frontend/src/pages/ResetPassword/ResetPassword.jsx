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
  const [success, setSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!token) {
      setError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã bị thiếu mã.");
      return;
    }

    if (!formData.password) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (!formData.confirmPassword) {
      setError("Vui lòng xác nhận mật khẩu mới.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);

      await authService.resetPassword({
        resetToken: token,
        newPassword: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      setMessage("Đặt lại mật khẩu thành công!");
      setSuccess(true);
    } catch (err) {
      if (err?.response?.status === 400) {
        setError(
          err?.response?.data?.message ||
            "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
        );
      } else {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể đặt lại mật khẩu.",
        );
      }
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

            <p>Nhập mật khẩu mới cho tài khoản của bạn.</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {message && <div className="success-message">{message}</div>}

          {success ? (
            <div className="reset-password-success">
              <div className="reset-password-success__icon">✓</div>

              <h2>Đặt lại mật khẩu thành công</h2>

              <p>
                Mật khẩu của bạn đã được cập nhật. Bạn có thể quay lại trang
                đăng nhập.
              </p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  navigate("/login", {
                    replace: true,
                  })
                }
              >
                Quay lại đăng nhập
              </button>
            </div>
          ) : (
            <form className="reset-password-form" onSubmit={handleSubmit}>
              <FormInput
                label="Mật khẩu mới"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu mới"
                required
                disabled={loading}
              />

              <FormInput
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu mới"
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
          )}

          {!success && (
            <div className="reset-password-card__back">
              <Link to="/login">Quay lại đăng nhập</Link>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
