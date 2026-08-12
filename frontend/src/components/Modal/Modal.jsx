import { useEffect } from "react";

import "./Modal.css";

export default function Modal({ isOpen, title, children, onClose, footer }) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayClick}>
      <div
        className="modal modal-component"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-component__header">
          <h2>{title}</h2>

          <button className="modal-component__close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-component__body">{children}</div>

        {footer && <div className="modal-component__footer">{footer}</div>}
      </div>
    </div>
  );
}
