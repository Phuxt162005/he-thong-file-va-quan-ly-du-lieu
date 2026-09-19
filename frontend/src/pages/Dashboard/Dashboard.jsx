import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Loading from "../../components/Loading/Loading";

import fileService from "../../services/fileService";
import userService from "../../services/userService";
import { getCurrentUser } from "../../utils/authStorage";

import "./Dashboard.css";

/* =========================================================
   ICONS
   ========================================================= */
function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 3.5h8l4 4V20.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5Z"
        fill="currentColor"
        opacity="0.9"
      />

      <path
        d="M14 3.5v4h4"
        fill="none"
        stroke="white"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      <path
        d="M8 12h8M8 15.5h5"
        fill="none"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StorageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="7" ry="3" fill="currentColor" />

      <path
        d="M5 6v5c0 1.66 3.13 3 7 3s7-1.34 7-3V6"
        fill="currentColor"
        opacity="0.9"
      />

      <path
        d="M5 11v5c0 1.66 3.13 3 7 3s7-1.34 7-3v-5"
        fill="currentColor"
        opacity="0.75"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 9 9h-9V3Z" fill="currentColor" />

      <path
        d="M14 3.25A9 9 0 0 1 20.75 10H14V3.25Z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}

function RemainingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" fill="currentColor" />

      <path
        d="m4 7.5 8 4.5 8-4.5M12 12v9"
        fill="none"
        stroke="white"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 16V5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="m7.5 9.5 4.5-4.5 4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M5 18.5h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RecentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M12 7v5l3 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyFileIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M17 9h22l10 10v34H17a4 4 0 0 1-4-4V13a4 4 0 0 1 4-4Z"
        fill="#dce7fa"
      />

      <path d="M39 9v11h10" fill="#cbd9f2" />

      <path
        d="M23 29h18M23 36h14M23 43h10"
        fill="none"
        stroke="#8ba5d3"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path d="m46 12 2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4Z" fill="#eaa1d0" />

      <path d="m53 27 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" fill="#9bb9f3" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3.5 6.5A2.5 2.5 0 0 1 6 4h4l2 2h6a2.5 2.5 0 0 1 2.5 2.5v8A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-10Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8.5 15.5 15.5 8.5M10 7.5l2-2a4 4 0 0 1 5.5 5.5l-2 2M14 16.5l-2 2A4 4 0 0 1 6.5 13l2-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" fill="currentColor" />

      <path d="M5 20c.7-3.6 3.2-5.5 7-5.5s6.3 1.9 7 5.5" fill="currentColor" />
    </svg>
  );
}

function PasswordIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 10V7.5a4 4 0 0 1 8 0V10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle cx="12" cy="15" r="1" fill="currentColor" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12h13M13 7l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [fileCount, setFileCount] = useState(0);
  const [storage, setStorage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = getCurrentUser();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryResponse, storageResponse] = await Promise.all([
        fileService.getDashboardSummary(),
        userService.getStorageQuota(),
      ]);
      const summaryData = summaryResponse?.data || summaryResponse || {};
      const storageData = storageResponse?.data || storageResponse || null;
      setFiles(
        Array.isArray(summaryData?.recentFiles) ? summaryData.recentFiles : [],
      );
      setStorage(storageData);
      setFileCount(Number(summaryData?.fileCount || 0));
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

  const used = Number(storage?.storageUsed || 0);

  const quota = Number(storage?.storageLimit || 0);

  const percentage = quota > 0 ? Math.min((used / quota) * 100, 100) : 0;

  const remaining = Math.max(quota - used, 0);

  const recentFiles = [...files]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0),
    )
    .slice(0, 5);

  const username = currentUser?.username || currentUser?.name || "bạn";

  return (
    <div className="dashboard-page">
      {/* =====================================================
          WELCOME
          ===================================================== */}

      <section className="dashboard-welcome">
        <div>
          <h1>Xin chào, {username}!</h1>

          <p>Chào mừng bạn quay trở lại. Đây là tổng quan dữ liệu của bạn.</p>
        </div>
      </section>

      {error && (
        <div className="error-message dashboard-error" role="alert">
          {error}
        </div>
      )}

      {/* =====================================================
          STATISTICS
          ===================================================== */}

      <section className="dashboard-stats">
        <div className="dashboard-stat-card dashboard-stat-card--files">
          <div className="dashboard-stat-card__icon">
            <FileIcon />
          </div>

          <div className="dashboard-stat-card__content">
            <span>Tổng số file</span>

            <strong>{fileCount}</strong>

            <small>Tổng số file đang lưu trữ</small>
          </div>
        </div>

        <div className="dashboard-stat-card dashboard-stat-card--used">
          <div className="dashboard-stat-card__icon">
            <StorageIcon />
          </div>

          <div className="dashboard-stat-card__content">
            <span>Đã sử dụng</span>

            <strong>{formatStorage(used)}</strong>

            <small>Dung lượng lưu trữ</small>
          </div>
        </div>

        <div className="dashboard-stat-card dashboard-stat-card--percentage">
          <div className="dashboard-stat-card__icon">
            <ChartIcon />
          </div>

          <div className="dashboard-stat-card__content">
            <span>Dung lượng</span>

            <strong>{percentage.toFixed(1)}%</strong>

            <small>Tỉ lệ sử dụng</small>
          </div>
        </div>

        <div className="dashboard-stat-card dashboard-stat-card--remaining">
          <div className="dashboard-stat-card__icon">
            <RemainingIcon />
          </div>

          <div className="dashboard-stat-card__content">
            <span>Còn lại</span>

            <strong>{formatStorage(remaining)}</strong>

            <small>Tổng dung lượng {formatStorage(quota)}</small>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <div className="dashboard-content">
        {/* STORAGE */}

        <section className="dashboard-card dashboard-storage-card">
          <div className="dashboard-card__header">
            <div className="dashboard-section-title">
              <div className="dashboard-section-title__icon dashboard-section-title__icon--blue">
                <StorageIcon />
              </div>

              <div>
                <h2>Dung lượng lưu trữ</h2>

                <p>Thống kê dung lượng sử dụng tài khoản</p>
              </div>
            </div>

            <Link to="/profile" className="dashboard-card__link">
              Chi tiết
              <ArrowIcon />
            </Link>
          </div>

          <div className="dashboard-storage">
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

              <span>Còn lại {formatStorage(remaining)}</span>
            </div>

            <div className="dashboard-storage__details">
              <div className="dashboard-storage-detail dashboard-storage-detail--used">
                <div className="dashboard-storage-detail__icon">
                  <UploadIcon />
                </div>

                <div>
                  <strong>{formatStorage(used)}</strong>

                  <span>Đã sử dụng</span>
                </div>
              </div>

              <div className="dashboard-storage-detail dashboard-storage-detail--remaining">
                <div className="dashboard-storage-detail__icon">
                  <RemainingIcon />
                </div>

                <div>
                  <strong>{formatStorage(remaining)}</strong>

                  <span>Dung lượng còn lại</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RECENT FILES */}

        <section className="dashboard-card dashboard-recent-card">
          <div className="dashboard-card__header">
            <div className="dashboard-section-title">
              <div className="dashboard-section-title__icon dashboard-section-title__icon--purple">
                <RecentIcon />
              </div>

              <div>
                <h2>File gần đây</h2>

                <p>Các file được cập nhật gần đây</p>
              </div>
            </div>

            <Link to="/files" className="dashboard-card__link">
              Xem tất cả
              <ArrowIcon />
            </Link>
          </div>

          {recentFiles.length === 0 ? (
            <div className="dashboard-empty">
              <div className="dashboard-empty__icon">
                <EmptyFileIcon />
              </div>

              <h3>Chưa có file nào.</h3>

              <p>Hãy tải lên file để bắt đầu quản lý dữ liệu của bạn!</p>

              <Link to="/files" className="dashboard-empty__button">
                <UploadIcon />
                Quản lý file
              </Link>
            </div>
          ) : (
            <div className="dashboard-file-list">
              {recentFiles.map((file) => (
                <div
                  className="dashboard-file-item"
                  key={file._id || file.id || file.name}
                >
                  <div className="dashboard-file-item__icon">
                    <FileTypeIcon file={file} />
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

      {/* =====================================================
          QUICK ACTIONS
          ===================================================== */}

      <section className="dashboard-card dashboard-quick-actions">
        <div className="dashboard-card__header">
          <div className="dashboard-section-title">
            <div className="dashboard-section-title__icon dashboard-section-title__icon--blue">
              <ArrowIcon />
            </div>

            <div>
              <h2>Thao tác nhanh</h2>

              <p>Truy cập nhanh các chức năng thường dùng</p>
            </div>
          </div>
        </div>

        <div className="dashboard-actions">
          <Link to="/files" className="dashboard-action dashboard-action--blue">
            <span className="dashboard-action__icon">
              <FolderIcon />
            </span>

            <span className="dashboard-action__content">
              <strong>Quản lý file</strong>

              <small>Xem và quản lý file, thư mục</small>
            </span>

            <ArrowIcon />
          </Link>

          <Link
            to="/shares"
            className="dashboard-action dashboard-action--purple"
          >
            <span className="dashboard-action__icon">
              <ShareIcon />
            </span>

            <span className="dashboard-action__content">
              <strong>Share Link</strong>

              <small>Quản lý liên kết chia sẻ</small>
            </span>

            <ArrowIcon />
          </Link>

          <Link
            to="/profile"
            className="dashboard-action dashboard-action--pink"
          >
            <span className="dashboard-action__icon">
              <UserIcon />
            </span>

            <span className="dashboard-action__content">
              <strong>Hồ sơ</strong>

              <small>Quản lý thông tin cá nhân</small>
            </span>

            <ArrowIcon />
          </Link>

          <Link
            to="/change-password"
            className="dashboard-action dashboard-action--blue"
          >
            <span className="dashboard-action__icon">
              <PasswordIcon />
            </span>

            <span className="dashboard-action__content">
              <strong>Đổi mật khẩu</strong>

              <small>Cập nhật mật khẩu</small>
            </span>

            <ArrowIcon />
          </Link>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */
function formatStorage(bytes) {
  if (!bytes || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(2)} ${units[index]}`;
}

function formatDate(date) {
  if (!date) {
    return "-";
  }
  return new Date(date).toLocaleString("vi-VN");
}

function FileTypeIcon({ file }) {
  const extension = getExtension(file?.name);

  const config = {
    pdf: ["#ef476f", "PDF"],

    doc: ["#2f80ed", "W"],
    docx: ["#2f80ed", "W"],

    xls: ["#25a66a", "X"],
    xlsx: ["#25a66a", "X"],
    csv: ["#25a66a", "X"],

    ppt: ["#f05a24", "P"],
    pptx: ["#f05a24", "P"],

    png: ["#35b98b", "IMG"],
    jpg: ["#35b98b", "IMG"],
    jpeg: ["#35b98b", "IMG"],
    gif: ["#35b98b", "IMG"],
    webp: ["#35b98b", "IMG"],

    zip: ["#9347e8", "ZIP"],
    rar: ["#9347e8", "ZIP"],
    "7z": ["#9347e8", "ZIP"],

    txt: ["#7f9abb", "TXT"],
    md: ["#7f9abb", "MD"],

    py: ["#4d82c3", "PY"],
    js: ["#d6a928", "JS"],
    jsx: ["#3aa6c8", "JS"],
    ts: ["#3478c8", "TS"],
    tsx: ["#3478c8", "TS"],
    html: ["#e56a3a", "HTML"],
    css: ["#4b83c4", "CSS"],
    json: ["#b59a2a", "JSON"],
    ipynb: ["#c96b2c", "PY"],
  }[extension] || [
    "#7f9abb",
    extension ? extension.slice(0, 4).toUpperCase() : "FILE",
  ];

  return (
    <svg
      viewBox="0 0 42 48"
      aria-hidden="true"
      style={{
        width: "25px",
        height: "29px",
      }}
    >
      <path d="M7 2h19l9 9v33H7z" fill={config[0]} />

      <path d="M26 2v10h9" fill="#fff" opacity=".45" />

      <text
        x="21"
        y="31"
        textAnchor="middle"
        fill="#fff"
        fontSize={config[1].length > 4 ? "5.5" : "9"}
        fontWeight="700"
        fontFamily="Arial,sans-serif"
      >
        {config[1]}
      </text>
    </svg>
  );
}

function getExtension(name = "") {
  const parts = name.toLowerCase().split(".");

  return parts.length > 1 ? parts.pop() : "";
}
