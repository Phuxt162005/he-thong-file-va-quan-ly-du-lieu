import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Loading from "../../components/Loading/Loading";

import fileService from "../../services/fileService";
import userService from "../../services/userService";

import "./Dashboard.css";

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [storage, setStorage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [fileResponse, storageResponse] = await Promise.all([
        fileService.getFiles(),
        userService.getStorageQuota(),
      ]);
      const fileData = fileResponse?.data || fileResponse || [];
      const storageData = storageResponse?.data || storageResponse || null;

      setFiles(Array.isArray(fileData) ? fileData : []);
      setStorage(storageData);
    } catch (err) {
      setError(err?.message || "Không thể tải dữ liệu Dashboard.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <Loading message="Đang tải Dashboard..." />
      </div>
    );
  }

  const used = Number(storage?.storageUsed || storage?.used || 0);
  const quota = Number(storage?.storageQuota || storage?.quota || 0);
  const percentage = quota > 0 ? Math.min((used / quota) * 100, 100) : 0;
  const recentFiles = [...files]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0),
    )
    .slice(0, 5);

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-page__header">
        <div>
          <h1>Dashboard</h1>
          <p>Tổng quan dữ liệu của bạn</p>
        </div>

        <button className="btn btn-secondary" onClick={loadDashboard}>
          Làm mới
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Statistics */}
      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card__icon">📄</div>
          <div>
            <span>Tổng số file</span>
            <strong>{files.length}</strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card__icon">💾</div>
          <div>
            <span>Đã sử dụng</span>
            <strong>{formatStorage(used)}</strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card__icon">📊</div>
          <div>
            <span>Dung lượng</span>
            <strong>{percentage.toFixed(1)}%</strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-card__icon">📦</div>
          <div>
            <span>Còn lại</span>
            <strong>{formatStorage(Math.max(quota - used, 0))}</strong>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="dashboard-content">
        {/* Storage */}
        <section className="dashboard-card">
          <div className="dashboard-card__header">
            <div>
              <h2>Dung lượng lưu trữ</h2>
              <p>Thống kê dung lượng hiện tại</p>
            </div>
            <Link to="/profile" className="dashboard-card__link">
              Chi tiết
            </Link>
          </div>

          <div className="dashboard-storage">
            <div className="dashboard-storage__numbers">
              <strong>{formatStorage(used)}</strong>
              <span>/ {formatStorage(quota)}</span>
            </div>
            <div className="dashboard-storage__progress">
              <div
                className="dashboard-storage__progress-value"
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>

            <div className="dashboard-storage__footer">
              <span>Đã sử dụng {percentage.toFixed(1)}%</span>
              <span>Còn lại {formatStorage(Math.max(quota - used, 0))}</span>
            </div>
          </div>
        </section>

        {/* Recent files */}
        <section className="dashboard-card">
          <div className="dashboard-card__header">
            <div>
              <h2>File gần đây</h2>
              <p>Các file được cập nhật gần đây</p>
            </div>
            <Link to="/files" className="dashboard-card__link">
              Xem tất cả
            </Link>
          </div>

          {recentFiles.length === 0 ? (
            <div className="dashboard-empty">
              <div className="dashboard-empty__icon">📄</div>
              <p>Chưa có file nào.</p>
              <Link to="/files" className="btn btn-primary">
                Quản lý file
              </Link>
            </div>
          ) : (
            <div className="dashboard-file-list">
              {recentFiles.map((file) => (
                <div className="dashboard-file-item" key={file._id}>
                  <div className="dashboard-file-item__icon">
                    {getFileIcon(file.name)}
                  </div>
                  <div className="dashboard-file-item__info">
                    <strong title={file.name}>{file.name}</strong>
                    <span>{formatStorage(file.size)}</span>
                  </div>
                  <div className="dashboard-file-item__date">
                    {formatDate(file.updatedAt || file.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick actions */}
      <section className="dashboard-card dashboard-quick-actions">
        <div className="dashboard-card__header">
          <div>
            <h2>Thao tác nhanh</h2>
            <p>Truy cập nhanh các chức năng thường dùng</p>
          </div>
        </div>

        <div className="dashboard-actions">
          <Link to="/files" className="dashboard-action">
            <span className="dashboard-action__icon">📁</span>
            <span>
              <strong>Quản lý file</strong>
              <small>Xem và quản lý file</small>
            </span>
          </Link>

          <Link to="/shares" className="dashboard-action">
            <span className="dashboard-action__icon">🔗</span>
            <span>
              <strong>Share Link</strong>
              <small>Quản lý liên kết chia sẻ</small>
            </span>
          </Link>

          <Link to="/profile" className="dashboard-action">
            <span className="dashboard-action__icon">👤</span>
            <span>
              <strong>Hồ sơ</strong>
              <small>Quản lý thông tin cá nhân</small>
            </span>
          </Link>

          <Link to="/change-password" className="dashboard-action">
            <span className="dashboard-action__icon">🔐</span>
            <span>
              <strong>Đổi mật khẩu</strong>
              <small>Cập nhật mật khẩu</small>
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}

// helper functions
function formatStorage(bytes) {
  if (!bytes || bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(2)} ${units[index]}`;
}

function formatDate(date) {
  if (!date) {
    return "-";
  }
  return new Date(date).toLocaleString("vi-VN");
}

function getFileIcon(name = "") {
  const extension = name.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
    return "🖼️";
  }
  if (extension === "pdf") {
    return "📕";
  }
  if (["doc", "docx"].includes(extension)) {
    return "📘";
  }
  if (["xls", "xlsx"].includes(extension)) {
    return "📗";
  }
  if (["ppt", "pptx"].includes(extension)) {
    return "📙";
  }
  if (["zip", "rar", "7z"].includes(extension)) {
    return "🗜️";
  }
  if (["mp4", "avi", "mkv", "mov"].includes(extension)) {
    return "🎬";
  }
  if (["mp3", "wav"].includes(extension)) {
    return "🎵";
  }
  return "📄";
}
