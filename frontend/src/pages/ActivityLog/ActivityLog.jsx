import { useCallback, useEffect, useState } from "react";

import Loading from "../../components/Loading/Loading";
import { useAuth } from "../../context/AuthContext";
import activityLogService from "../../services/activityLogService";

import "./ActivityLog.css";

const PAGE_SIZE = 12;

const ACTION_CONFIG = {
  create: {
    label: "File Create",
    className: "activity-action--create",
    icon: "plus",
  },
  create_file: {
    label: "File Create",
    className: "activity-action--create",
    icon: "plus",
  },
  create_folder: {
    label: "Folder Create",
    className: "activity-action--create",
    icon: "plus",
  },
  upload: {
    label: "File Upload",
    className: "activity-action--upload",
    icon: "upload",
  },
  download: {
    label: "File Download",
    className: "activity-action--download",
    icon: "download",
  },
  preview: {
    label: "File Preview",
    className: "activity-action--preview",
    icon: "eye",
  },
  rename: {
    label: "File Rename",
    className: "activity-action--rename",
    icon: "edit",
  },
  move: {
    label: "File Move",
    className: "activity-action--move",
    icon: "move",
  },
  copy: {
    label: "File Copy",
    className: "activity-action--copy",
    icon: "copy",
  },
  delete: {
    label: "File Delete",
    className: "activity-action--delete",
    icon: "trash",
  },
  restore: {
    label: "File Restore",
    className: "activity-action--restore",
    icon: "restore",
  },
  share: {
    label: "Share Link",
    className: "activity-action--share",
    icon: "link",
  },
  revoke_share: {
    label: "Revoke Share",
    className: "activity-action--delete",
    icon: "link",
  },
  grant_permission: {
    label: "Permission Grant",
    className: "activity-action--permission",
    icon: "key",
  },
  update_permission: {
    label: "Permission Update",
    className: "activity-action--permission",
    icon: "key",
  },
  revoke_permission: {
    label: "Permission Revoke",
    className: "activity-action--delete",
    icon: "key",
  },
  login: {
    label: "Login",
    className: "activity-action--login",
    icon: "login",
  },
  logout: {
    label: "Logout",
    className: "activity-action--logout",
    icon: "logout",
  },
  change_password: {
    label: "Change Password",
    className: "activity-action--permission",
    icon: "key",
  },
};

const RESOURCE_LABELS = {
  file: "File",
  folder: "Thư mục",
  share: "Share",
  permissions: "Quyền",
  user: "Người dùng",
};

function formatAction(action) {
  if (!action) {
    return {
      label: "-",
      className: "activity-action--default",
      icon: "file",
    };
  }

  if (ACTION_CONFIG[action]) {
    return ACTION_CONFIG[action];
  }

  const label = action
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

  return {
    label,
    className: "activity-action--default",
    icon: "file",
  };
}

function formatResourceType(resourceType) {
  if (!resourceType) {
    return "-";
  }

  return RESOURCE_LABELS[resourceType] || resourceType;
}

function formatDate(date) {
  if (!date) {
    return "-";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  const time = parsedDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const day = parsedDate.getDate();
  const month = parsedDate.getMonth() + 1;
  const year = parsedDate.getFullYear();

  return `${time} ${day}/${month}/${year}`;
}

function formatDetails(details) {
  if (!details || typeof details !== "object") {
    return "-";
  }

  const entries = Object.entries(details);

  if (entries.length === 0) {
    return "-";
  }

  return entries
    .map(([key, value]) => {
      let formattedValue = value;

      if (typeof value === "object" && value !== null) {
        try {
          formattedValue = JSON.stringify(value);
        } catch {
          formattedValue = String(value);
        }
      }

      return `${key}: ${formattedValue}`;
    })
    .join(" • ");
}

function getResultClass(result) {
  if (result === "DENIED") {
    return "audit-result audit-result--denied";
  }

  if (result === "FAILED") {
    return "audit-result audit-result--failed";
  }

  return "audit-result audit-result--success";
}

function ActivityIcon({ type }) {
  switch (type) {
    case "plus":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 5v14M5 12h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      );

    case "upload":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 16V4M7 9l5-5 5 5M5 20h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "download":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 4v12M7 11l5 5 5-5M5 20h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "trash":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 7h14M9 7V4h6v3M8 10v7M12 10v7M16 10v7M7 7l1 14h8l1-14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "restore":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 10a7 7 0 1 1 2 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M6 5v5h5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "move":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 7h5l2 2h7v9H5V7Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M12 12l3 3m0-3-3 3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "edit":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="m4 16 10.5-10.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="m13 7 4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );

    case "copy":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect
            x="8"
            y="8"
            width="11"
            height="12"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );

    case "link":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M9 15 15 9M7 17H6a4 4 0 0 1 0-8h4M17 7h1a4 4 0 0 1 0 8h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "key":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle
            cx="8"
            cy="15"
            r="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="m11 12 8-8M16 7l2 2M14 9l2 2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "eye":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="12"
            cy="12"
            r="2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );

    case "login":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M13 5h5v14h-5M11 12h9M16 8l4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "logout":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M11 5H6v14h5M8 12h11M15 8l4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 3h8l4 4v14H6V3Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M14 3v5h4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );
  }
}

function ResourceIcon({ resourceType }) {
  if (resourceType === "folder") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M3 6.5A1.5 1.5 0 0 1 4.5 5H10l2 2h7.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-11Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h8l4 4v14H6V3Z" fill="currentColor" />
      <path
        d="M14 3v5h4"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 12h6M9 15h6"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ActivityLog() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [activities, setActivities] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [auditError, setAuditError] = useState("");
  const [page, setPage] = useState(1);

  const loadData = useCallback(
    async ({ initial = false } = {}) => {
      try {
        if (initial) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");
        setAuditError("");

        const activityPromise = activityLogService.getMyActivities(100);

        const auditPromise = isAdmin
          ? activityLogService.getDeniedAuditLogs(100)
          : Promise.resolve([]);

        const [activityResponse, auditResponse] = await Promise.all([
          activityPromise,
          auditPromise,
        ]);

        const activityData = Array.isArray(activityResponse)
          ? activityResponse
          : activityResponse?.activities || activityResponse?.data || [];

        const auditData = Array.isArray(auditResponse)
          ? auditResponse
          : auditResponse?.logs || auditResponse?.data || [];

        setActivities(Array.isArray(activityData) ? activityData : []);
        setAuditLogs(Array.isArray(auditData) ? auditData : []);
        setPage(1);
      } catch (err) {
        if (isAdmin) {
          setAuditError(
            err?.message || "Không thể tải dữ liệu Activity/Audit Log.",
          );
        } else {
          setError(err?.message || "Không thể tải lịch sử hoạt động.");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAdmin],
  );

  useEffect(() => {
    loadData({ initial: true });
  }, [loadData]);

  const totalPages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE));

  const startIndex = (page - 1) * PAGE_SIZE;
  const visibleActivities = activities.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  const firstItem = activities.length === 0 ? 0 : startIndex + 1;

  const lastItem = Math.min(startIndex + PAGE_SIZE, activities.length);

  const goToPage = (nextPage) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
  };

  if (loading) {
    return <Loading message="Đang tải lịch sử hoạt động..." />;
  }

  return (
    <div className="activity-page">
      <div className="activity-page__header">
        <div>
          <h1>Lịch sử hoạt động</h1>
          <p>Theo dõi các thao tác gần đây của tài khoản trên hệ thống.</p>
        </div>

        <button
          type="button"
          className="activity-refresh-button"
          onClick={() => loadData()}
          disabled={refreshing}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M20 11a8 8 0 0 0-14.9-4M4 5v4h4M4 13a8 8 0 0 0 14.9 4M20 19v-4h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <span>{refreshing ? "Đang tải..." : "Làm mới"}</span>
        </button>
      </div>

      {error && <div className="activity-error">{error}</div>}

      <section className="activity-card">
        <div className="activity-card__header">
          <div className="activity-card__title">
            <div className="activity-card__icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 5h16M4 12h16M4 19h16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <circle cx="7" cy="5" r="1.4" fill="currentColor" />
                <circle cx="7" cy="12" r="1.4" fill="currentColor" />
                <circle cx="7" cy="19" r="1.4" fill="currentColor" />
              </svg>
            </div>

            <div>
              <h2>Hoạt động của tôi</h2>
              <p>Lịch sử thao tác của tài khoản hiện tại.</p>
            </div>
          </div>

          <span className="activity-count">{activities.length} hoạt động</span>
        </div>

        {activities.length === 0 ? (
          <div className="activity-empty">
            <div className="activity-empty__icon">
              <ActivityIcon type="file" />
            </div>
            <h3>Chưa có hoạt động</h3>
            <p>Không có lịch sử hoạt động nào để hiển thị.</p>
          </div>
        ) : (
          <>
            <div className="activity-table-wrapper">
              <table className="activity-table">
                <colgroup>
                  <col className="activity-col-time" />
                  <col className="activity-col-action" />
                  <col className="activity-col-resource" />
                  <col className="activity-col-id" />
                  <col className="activity-col-details" />
                </colgroup>

                <thead>
                  <tr>
                    <th>
                      <span className="activity-th-sort">
                        Thời gian
                        <span className="activity-sort-icon">↕</span>
                      </span>
                    </th>
                    <th>Thao tác</th>
                    <th>Tài nguyên</th>
                    <th>Resource ID</th>
                    <th>Chi tiết</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleActivities.map((activity) => {
                    const action = formatAction(activity.action);

                    return (
                      <tr key={activity._id}>
                        <td className="activity-table__date">
                          {formatDate(activity.createdAt)}
                        </td>

                        <td>
                          <span
                            className={`activity-action ${action.className}`}
                          >
                            <span className="activity-action__icon">
                              <ActivityIcon type={action.icon} />
                            </span>

                            <span>{action.label}</span>
                          </span>
                        </td>

                        <td>
                          <span className="activity-resource">
                            <span
                              className={`activity-resource__icon ${
                                activity.resourceType === "folder"
                                  ? "is-folder"
                                  : ""
                              }`}
                            >
                              <ResourceIcon
                                resourceType={activity.resourceType}
                              />
                            </span>

                            <span>
                              {formatResourceType(activity.resourceType)}
                            </span>
                          </span>
                        </td>

                        <td className="activity-table__resource">
                          {activity.resourceId || "-"}
                        </td>

                        <td className="activity-table__details">
                          {formatDetails(activity.details)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="activity-footer">
              <span>
                Hiển thị {firstItem} - {lastItem} của {activities.length} hoạt
                động
              </span>

              <div className="activity-pagination">
                <button
                  type="button"
                  className="activity-pagination__arrow"
                  disabled={page === 1}
                  onClick={() => goToPage(page - 1)}
                  aria-label="Trang trước"
                >
                  ‹
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((number) => (
                  <button
                    type="button"
                    key={number}
                    className={
                      number === page
                        ? "activity-pagination__number is-active"
                        : "activity-pagination__number"
                    }
                    onClick={() => goToPage(number)}
                  >
                    {number}
                  </button>
                ))}

                <button
                  type="button"
                  className="activity-pagination__arrow"
                  disabled={page === totalPages}
                  onClick={() => goToPage(page + 1)}
                  aria-label="Trang sau"
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {isAdmin && (
        <section className="activity-card activity-card--admin">
          <div className="activity-card__header">
            <div className="activity-card__title">
              <div className="activity-card__icon activity-card__icon--admin">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 3 20 6v5c0 5-3.3 8.6-8 10-4.7-1.4-8-5-8-10V6l8-3Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <h2>Audit / Security Log</h2>
                <p>Các sự kiện truy cập bị hệ thống từ chối.</p>
              </div>
            </div>

            <span className="activity-admin-badge">Admin</span>
          </div>

          {auditError && <div className="activity-error">{auditError}</div>}

          {auditLogs.length === 0 ? (
            <div className="activity-empty">
              <div className="activity-empty__icon">
                <ActivityIcon type="file" />
              </div>
              <h3>Không có sự kiện bị từ chối</h3>
              <p>Chưa ghi nhận sự kiện DENIED nào.</p>
            </div>
          ) : (
            <div className="activity-table-wrapper">
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Result</th>
                    <th>IP</th>
                    <th>Chi tiết</th>
                  </tr>
                </thead>

                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log._id}>
                      <td className="activity-table__date">
                        {formatDate(log.createdAt)}
                      </td>

                      <td>{formatAction(log.action).label}</td>

                      <td>{formatResourceType(log.resourceType)}</td>

                      <td>
                        <span className={getResultClass(log.result)}>
                          {log.result || "DENIED"}
                        </span>
                      </td>

                      <td className="activity-table__resource">
                        {log.ipAddress || "-"}
                      </td>

                      <td className="activity-table__details">
                        {formatDetails(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
