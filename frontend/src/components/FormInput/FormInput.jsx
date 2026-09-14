import { useState } from "react";

import "./FormInput.css";

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
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="form-input">
      {label && (
        <label className="form-input__label" htmlFor={name}>
          {label}

          {required && <span className="form-input__required">*</span>}
        </label>
      )}

      <div className="form-input__control">
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
            {showPassword ? "◉" : "○"}
          </button>
        )}
      </div>

      {error && <span className="form-input__error">{error}</span>}
    </div>
  );
}
