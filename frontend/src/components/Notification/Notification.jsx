import { useEffect } from "react";

import "./Notification.css";

export default function Notification({
  type = "info",
  message,
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (!message) {
      return;
    }
    if (!duration) {
      return;
    }

    const timer = setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [message, duration, onClose]);

  if (!message) {
    return null;
  }

  return (
    <div className={`notification notification--${type}`}>
      <div className="notification__icon">{getIcon(type)}</div>

      <div className="notification__content">
        <span>{getTitle(type)}</span>
        <p>{message}</p>
      </div>

      <button
        type="button"
        className="notification__close"
        onClick={onClose}
        aria-label="Đóng thông báo"
      >
        ×
      </button>
    </div>
  );
}

function getIcon(type) {
  switch (type) {
    case "success":
      return "✓";
    case "error":
      return "!";
    case "warning":
      return "⚠";
    case "info":
    default:
      return "i";
  }
}

function getTitle(type) {
  switch (type) {
    case "success":
      return "Thành công";
    case "error":
      return "Lỗi";
    case "warning":
      return "Cảnh báo";
    case "info":
    default:
      return "Thông báo";
  }
}
