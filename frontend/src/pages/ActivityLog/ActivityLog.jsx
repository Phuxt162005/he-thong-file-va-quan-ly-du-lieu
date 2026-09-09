import { useCallback, useEffect, useState } from "react";

import Loading from "../../components/Loading/Loading";
import { useAuth } from "../../context/AuthContext";
import activityLogService from "../../services/activityLogService";

import "./ActivityLog.css";

const ACTION_LABELS = {
  create: "Tạo",
  create_file: "Tạo file",
  create_folder: "Tạo thư mục",
  upload: "Tải lên",
  download: "Tải xuống",
  preview: "Xem trước",
  rename: "Đổi tên",
  move: "Di chuyển",
  copy: "Sao chép",
  delete: "Xóa",
  restore: "Khôi phục",
  share: "Chia sẻ",
  revoke_share: "Thu hồi chia sẻ",
  grant_permission: "Cấp quyền",
  update_permission: "Cập nhật quyền",
  revoke_permission: "Thu hồi quyền",
  login: "Đăng nhập",
  logout: "Đăng xuất",
  change_password: "Đổi mật khẩu",
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
    return "-";
  }

  if (ACTION_LABELS[action]) {
    return ACTION_LABELS[action];
  }

  return action
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
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

  return parsedDate.toLocaleString("vi-VN");
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

export default function ActivityLog() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [activities, setActivities] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [auditError, setAuditError] = useState("");

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
          className="btn btn-secondary"
          onClick={() => loadData()}
          disabled={refreshing}
        >
          {refreshing ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <section className="activity-card">
        <div className="activity-card__header">
          <div>
            <h2>Hoạt động của tôi</h2>
            <p>Lịch sử thao tác của tài khoản hiện tại.</p>
          </div>

          <span className="activity-count">{activities.length} hoạt động</span>
        </div>

        {activities.length === 0 ? (
          <div className="activity-empty">
            <div className="activity-empty__icon">📝</div>
            <h3>Chưa có hoạt động</h3>
            <p>Không có lịch sử hoạt động nào để hiển thị.</p>
          </div>
        ) : (
          <div className="activity-table-wrapper">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Thao tác</th>
                  <th>Tài nguyên</th>
                  <th>Resource ID</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>

              <tbody>
                {activities.map((activity) => (
                  <tr key={activity._id}>
                    <td className="activity-table__date">
                      {formatDate(activity.createdAt)}
                    </td>

                    <td>
                      <span className="activity-action">
                        {formatAction(activity.action)}
                      </span>
                    </td>

                    <td>{formatResourceType(activity.resourceType)}</td>

                    <td className="activity-table__resource">
                      {activity.resourceId || "-"}
                    </td>

                    <td className="activity-table__details">
                      {formatDetails(activity.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isAdmin && (
        <section className="activity-card">
          <div className="activity-card__header">
            <div>
              <h2>Audit / Security Log</h2>
              <p>Các sự kiện truy cập bị hệ thống từ chối.</p>
            </div>

            <span className="activity-admin-badge">Admin</span>
          </div>

          {auditError && <div className="error-message">{auditError}</div>}

          {auditLogs.length === 0 ? (
            <div className="activity-empty">
              <div className="activity-empty__icon">🛡️</div>
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

                      <td>{formatAction(log.action)}</td>

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
