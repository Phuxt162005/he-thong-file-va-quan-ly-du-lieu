import { useEffect, useState } from "react";

import Loading from "../../components/Loading/Loading";
import notificationService from "../../services/notificationService";

import "./Notifications.css";

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTypeLabel(type) {
  const labels = {
    share_created: "Chia sẻ",
    share_expiring: "Share Link sắp hết hạn",
    trash_expiring: "Thùng rác",
    activity: "Hoạt động",
    profile_updated: "Hồ sơ",
  };
  return labels[type] || "Thông báo";
}

function getResourceLabel(type) {
  if (type === "file") {
    return "File";
  }
  if (type === "folder") {
    return "Thư mục";
  }
  if (type === "share") {
    return "Share Link";
  }
  if (type === "user") {
    return "Tài khoản";
  }
  return "Hệ thống";
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      loadNotifications();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, from, to]);

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const result = await notificationService.getNotifications({
        limit: 1000,
        search: search.trim(),
        from,
        to,
      });

      setNotifications(
        Array.isArray(result?.notifications) ? result.notifications : [],
      );
      setUnreadCount(Number(result?.unreadCount || 0));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể tải thông báo.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRead(notification) {
    if (!notification?._id || notification.readAt) {
      return;
    }

    try {
      await notificationService.markRead(notification._id);
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
      setUnreadCount((current) => Math.max(current - 1, 0));
    } catch (err) {
      setError(err?.message || "Không thể đánh dấu thông báo đã đọc.");
    }
  }

  async function handleReadAll() {
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
    } catch (err) {
      setError(err?.message || "Không thể đánh dấu tất cả đã đọc.");
    }
  }

  function clearFilters() {
    setSearch("");
    setFrom("");
    setTo("");
  }

  return (
    <div className="notifications-page">
      <div className="notifications-page__header">
        <div>
          <h1>Thông báo</h1>

          <p>
            Theo dõi toàn bộ hoạt động và thông báo liên quan đến tài khoản,
            file, thư mục và Share Link.
          </p>
        </div>

        <button
          type="button"
          className="notifications-page__read-all"
          onClick={handleReadAll}
          disabled={unreadCount === 0}
        >
          Đọc tất cả
        </button>
      </div>

      <section className="notifications-page__filters">
        <div className="notifications-page__search">
          <span>⌕</span>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên file, thư mục, nội dung thông báo..."
          />
        </div>

        <label>
          <span>Từ ngày</span>

          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>

        <label>
          <span>Đến ngày</span>

          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>

        {(search || from || to) && (
          <button
            type="button"
            className="notifications-page__clear"
            onClick={clearFilters}
          >
            Xóa lọc
          </button>
        )}
      </section>

      {error && <div className="error-message">{error}</div>}

      <section className="notifications-page__summary">
        <span>
          Tổng số: <strong>{notifications.length}</strong>
        </span>

        <span>
          Chưa đọc: <strong>{unreadCount}</strong>
        </span>
      </section>

      <section className="notifications-page__list">
        {loading ? (
          <Loading message="Đang tải thông báo..." />
        ) : notifications.length === 0 ? (
          <div className="notifications-page__empty">
            Không tìm thấy thông báo phù hợp.
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              type="button"
              key={notification._id}
              className={
                notification.readAt
                  ? "notification-card"
                  : "notification-card notification-card--unread"
              }
              onClick={() => handleRead(notification)}
            >
              <span className="notification-card__indicator" />

              <span className="notification-card__main">
                <span className="notification-card__top">
                  <strong>{notification.title}</strong>

                  <span className="notification-card__type">
                    {getTypeLabel(notification.type)}
                  </span>
                </span>

                <span className="notification-card__message">
                  {notification.message}
                </span>

                <span className="notification-card__meta">
                  <span>
                    Loại: {getResourceLabel(notification.resourceType)}
                  </span>

                  <span>Tạo lúc: {formatDate(notification.createdAt)}</span>

                  <span>
                    {notification.readAt
                      ? `Đã đọc: ${formatDate(notification.readAt)}`
                      : "Chưa đọc"}
                  </span>
                </span>
              </span>
            </button>
          ))
        )}
      </section>
    </div>
  );
}
