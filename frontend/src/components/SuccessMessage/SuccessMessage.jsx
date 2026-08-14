export default function SuccessMessage({ message, onClose }) {
  if (!message) {
    return null;
  }

  return (
    <div className="success-message">
      <span>{message}</span>

      {onClose && (
        <button type="button" onClick={onClose} aria-label="Đóng thông báo">
          ×
        </button>
      )}
    </div>
  );
}
