import { useState } from "react";

import "./FormInput.css";

function UserIcon() {
  return (
    <svg className="form-input__icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M5.5 19c.6-3.1 3.1-5 6.5-5s5.9 1.9 6.5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="form-input__icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="5.5"
        y="10"
        width="13"
        height="10"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon({ hidden = false }) {
  if (hidden) {
    return (
      <svg
        className="form-input__password-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M3.5 3.5l17 17"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M10.6 5.2A10.8 10.8 0 0 1 12 5.1c5.1 0 8.4 4.9 9 6.9-.3 1-1.2 2.5-2.6 3.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M6.1 7.2C4.2 8.7 3.2 10.7 3 12c.6 2 3.9 6.9 9 6.9 1.2 0 2.3-.2 3.2-.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      className="form-input__password-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="12"
        r="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  error = "",
  disabled = false,
  required = false,
  variant = "",
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  const isLoginVariant = variant === "login";

  const renderLeadingIcon = () => {
    if (!isLoginVariant) {
      return null;
    }

    if (isPassword) {
      return <LockIcon />;
    }

    if (name === "username") {
      return <UserIcon />;
    }

    return null;
  };

  return (
    <div className={`form-input ${isLoginVariant ? "form-input--login" : ""}`}>
      {label && (
        <label className="form-input__label" htmlFor={name}>
          {label}

          {required && <span className="form-input__required">*</span>}
        </label>
      )}

      <div className="form-input__control">
        {renderLeadingIcon()}

        <input
          id={name}
          name={name}
          type={inputType}
          className={
            error
              ? "input form-input__field form-input__field--error"
              : "input form-input__field"
          }
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
        />

        {isPassword && (
          <button
            type="button"
            className="form-input__password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={disabled}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
            title={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
          >
            <EyeIcon hidden={showPassword} />
          </button>
        )}
      </div>

      {error && <span className="form-input__error">{error}</span>}
    </div>
  );
}
