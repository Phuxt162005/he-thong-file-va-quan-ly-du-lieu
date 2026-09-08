import { useEffect, useState } from "react";

import Modal from "../Modal/Modal";
import FormInput from "../FormInput/FormInput";
import Loading from "../Loading/Loading";

import permissionService from "../../services/permissionService";
import userService from "../../services/userService";

import "./PermissionModal.css";

const PERMISSION_OPTIONS = [
  { value: "read", label: "Xem" },
  { value: "write", label: "Chỉnh sửa" },
  { value: "download", label: "Download" },
  { value: "delete", label: "Xóa" },
  { value: "share", label: "Chia sẻ" },
  {
    value: "permission_management",
    label: "Quản lý quyền",
  },
];

export default function PermissionModal({
  isOpen,
  resourceId,
  resourceType,
  resource,
  currentUserId,
  onClose,
}) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Có thể nhập nhiều username, phân cách bằng dấu phẩy hoặc xuống dòng
  const [loginNames, setLoginNames] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState(["read"]);
  const [confirmRevoke, setConfirmRevoke] = useState(null);
  const ownerId =
    resource?.owner?._id ||
    resource?.owner?.id ||
    (typeof resource?.owner === "string" ? resource.owner : null) ||
    null;
  const isOwner = Boolean(
    ownerId && currentUserId && ownerId.toString() === currentUserId.toString(),
  );
  const ownerName =
    resource?.owner?.username ||
    resource?.owner?.login_name ||
    resource?.owner?.email ||
    "Chủ sở hữu";

  useEffect(() => {
    if (!isOpen || !resourceId) {
      return;
    }
    setError("");
    setLoginNames("");
    setSelectedPermissions(["read"]);
    setConfirmRevoke(null);

    loadPermissions();
  }, [isOpen, resourceId, resourceType]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await permissionService.getPermissions(
        resourceType,
        resourceId,
      );
      const data = response?.data || response || [];

      setPermissions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể tải danh sách quyền.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permission) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permission)) {
        return prev.filter((item) => item !== permission);
      }
      return [...prev, permission];
    });
  };

  const parseLoginNames = () => {
    return [
      ...new Set(
        loginNames
          .split(/[\n,;]+/)
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ];
  };

  const handleGrant = async () => {
    const users = parseLoginNames();
    if (users.length === 0) {
      setError("Vui lòng nhập ít nhất một tên đăng nhập.");
      return;
    }
    if (selectedPermissions.length === 0) {
      setError("Vui lòng chọn ít nhất một quyền.");
      return;
    }
    if (selectedPermissions.includes("permission_management") && !isOwner) {
      setError("Chỉ Owner mới được cấp quyền Quản lý quyền.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const errors = [];
      for (const loginName of users) {
        try {
          const user = await userService.findByLoginName(loginName);
          if (!user?._id) {
            errors.push(`${loginName}: không tìm thấy người dùng.`);
            continue;
          }
          await permissionService.grantPermission(
            user._id,
            resourceId,
            resourceType,
            selectedPermissions,
          );
        } catch (err) {
          errors.push(
            `${loginName}: ${
              err?.response?.data?.message ||
              err?.message ||
              "không thể cấp quyền."
            }`,
          );
        }
      }

      if (errors.length > 0) {
        setError(errors.join(" "));
      } else {
        setLoginNames("");
        setSelectedPermissions(["read"]);
      }

      await loadPermissions();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (permissionId, newPermissions) => {
    if (!newPermissions.length) {
      setError("Người dùng phải có ít nhất một quyền.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await permissionService.updatePermission(permissionId, newPermissions);
      await loadPermissions();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể cập nhật quyền.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirmRevoke) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await permissionService.revokePermission(confirmRevoke._id);
      setConfirmRevoke(null);
      await loadPermissions();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể thu hồi quyền.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} title="Quản lý quyền" onClose={onClose}>
        {error && <div className="error-message">{error}</div>}

        <div className="permission-modal">
          {/* OWNER */}
          <div className="permission-modal__owner">
            <h3>Chủ sở hữu</h3>

            <div className="permission-item permission-item--owner">
              <strong>{ownerName}</strong>

              <span>👑 Owner — có toàn quyền</span>
            </div>
          </div>

          {/* GRANT */}
          <div className="permission-modal__grant">
            <h3>Cấp quyền</h3>

            <FormInput
              label="Tên đăng nhập"
              name="loginNames"
              value={loginNames}
              onChange={(event) => setLoginNames(event.target.value)}
              placeholder="Nhập username, có thể nhập nhiều người"
              disabled={saving}
            />

            <small>
              Có thể nhập nhiều username, phân cách bằng dấu phẩy hoặc xuống
              dòng.
            </small>

            <div className="permission-modal__options">
              {PERMISSION_OPTIONS.map((option) => {
                const disabled = saving;

                return (
                  <label key={option.value}>
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(option.value)}
                      onChange={() => handlePermissionChange(option.value)}
                      disabled={saving || disabled}
                    />

                    {option.label}

                    {disabled && (
                      <span className="permission-option__owner-only">
                        {" "}
                        (Owner)
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGrant}
              disabled={
                saving || !loginNames.trim() || selectedPermissions.length === 0
              }
            >
              {saving ? "Đang cấp..." : "Cấp quyền"}
            </button>
          </div>

          {/* LIST */}
          <div className="permission-modal__list">
            <h3>Người đang được cấp quyền</h3>

            {loading ? (
              <Loading message="Đang tải quyền..." />
            ) : permissions.length === 0 ? (
              <div className="permission-modal__empty">
                Chưa có người dùng nào được cấp quyền.
              </div>
            ) : (
              permissions.map((permission) => (
                <PermissionItem
                  key={permission._id}
                  permission={permission}
                  saving={saving}
                  isOwner={isOwner}
                  onUpdate={handleUpdate}
                  onRevoke={(item) => setConfirmRevoke(item)}
                />
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* CONFIRM REVOKE */}
      <Modal
        isOpen={Boolean(confirmRevoke)}
        title="Xác nhận thu hồi quyền"
        onClose={() => {
          if (!saving) {
            setConfirmRevoke(null);
          }
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmRevoke(null)}
              disabled={saving}
            >
              Hủy
            </button>

            <button
              type="button"
              className="btn btn-danger"
              onClick={handleRevoke}
              disabled={saving}
            >
              {saving ? "Đang thu hồi..." : "Thu hồi"}
            </button>
          </>
        }
      >
        <p>
          Bạn có chắc muốn thu hồi toàn bộ quyền của{" "}
          <strong>
            {confirmRevoke?.user?.username ||
              confirmRevoke?.user?.login_name ||
              "người dùng này"}
          </strong>
          ?
        </p>

        <p>Người dùng sẽ không còn quyền trực tiếp trên tài nguyên này.</p>
      </Modal>
    </>
  );
}

function PermissionItem({ permission, saving, isOwner, onUpdate, onRevoke }) {
  const user = permission.user || {};
  const [selected, setSelected] = useState(permission.permissions || []);

  useEffect(() => {
    setSelected(permission.permissions || []);
  }, [permission.permissions]);

  const togglePermission = (permissionName) => {
    setSelected((prev) => {
      if (prev.includes(permissionName)) {
        return prev.filter((item) => item !== permissionName);
      }
      return [...prev, permissionName];
    });
  };

  return (
    <div className="permission-item">
      <div className="permission-item__user">
        <strong>{user.username || user.login_name || "Người dùng"}</strong>

        <span>
          {user.first_name || ""} {user.last_name || ""}
        </span>
      </div>

      <div className="permission-item__permissions">
        {PERMISSION_OPTIONS.map((option) => {
          const ownerOnly = option.value === "permission_management";
          const disabled = saving;

          return (
            <label key={option.value}>
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => togglePermission(option.value)}
                disabled={disabled}
              />

              {option.label}
            </label>
          );
        })}
      </div>

      <div className="permission-item__actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onUpdate(permission._id, selected)}
          disabled={saving || selected.length === 0}
        >
          Lưu
        </button>

        <button
          type="button"
          className="btn btn-danger"
          onClick={() => onRevoke(permission)}
          disabled={saving}
        >
          Thu hồi
        </button>
      </div>
    </div>
  );
}
