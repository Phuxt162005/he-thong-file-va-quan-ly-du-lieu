import { useEffect, useRef, useState } from "react";

import notificationService from "../../services/notificationService";

import "./NotificationBell.css";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M10 22h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapperRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const result = await notificationService.getNotifications(50);
      setNotifications(
        Array.isArray(result?.notifications) ? result.notifications : [],
      );
      setUnreadCount(Number(result?.unreadCount || 0));
    } catch {
      // Không làm hỏng Header.
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    useEffect(() => {
      const handleOpenNotifications = () => {
        setOpen(true);
        loadNotifications();
      };
      window.addEventListener("open-notifications", handleOpenNotifications);
      return () => {
        window.removeEventListener(
          "open-notifications",
          handleOpenNotifications,
        );
      };
    }, []);

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleToggle = () => {
    setOpen((current) => !current);

    if (!open) {
      loadNotifications();
    }
  };

  const handleRead = async (notification) => {
    if (notification?.readAt) {
      return;
    }

    try {
      await notificationService.markRead(notification._id);
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? {
                ...item,
                readAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      setUnreadCount((current) => Math.max(current - 1, 0));
    } catch {
      // Giữ nguyên trạng thái.
    }
  };

  const handleReadAll = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      await notificationService.markAllRead();
      const now = new Date().toISOString();
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          readAt: item.readAt || now,
        })),
      );

      setUnreadCount(0);
    } catch {
      // Giữ nguyên panel.
    }
  };

  return (
    <div className="notification-bell" ref={wrapperRef}>
      <button
        type="button"
        className="notification-bell__button"
        aria-label="Thông báo"
        aria-expanded={open}
        onClick={handleToggle}
      >
        <BellIcon />

        {unreadCount > 0 && (
          <span className="notification-bell__badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-bell__panel">
          <div className="notification-bell__header">
            <div>
              <strong>Thông báo</strong>

              <span>
                {unreadCount > 0
                  ? `${unreadCount} chưa đọc`
                  : "Không có thông báo chưa đọc"}
              </span>
            </div>

            <button
              type="button"
              className="notification-bell__read-all"
              disabled={unreadCount === 0}
              onClick={handleReadAll}
            >
              Đọc tất cả
            </button>
          </div>

          <div className="notification-bell__list">
            {notifications.length === 0 ? (
              <div className="notification-bell__empty">Chưa có thông báo.</div>
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification._id}
                  className={
                    notification.readAt
                      ? "notification-bell__item"
                      : "notification-bell__item notification-bell__item--unread"
                  }
                  onClick={() => handleRead(notification)}
                >
                  <span className="notification-bell__item-dot" />

                  <span className="notification-bell__item-content">
                    <strong>{notification.title}</strong>

                    <span>{notification.message}</span>

                    <small>{formatDate(notification.createdAt)}</small>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
