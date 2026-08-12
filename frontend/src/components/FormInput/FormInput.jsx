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
  return (
    <div className="form-input">
      {label && (
        <label className="form-input__label" htmlFor={name}>
          {label}

          {required && <span className="form-input__required">*</span>}
        </label>
      )}

      <input
        id={name}
        name={name}
        type={type}
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

      {error && <span className="form-input__error">{error}</span>}
    </div>
  );
}
