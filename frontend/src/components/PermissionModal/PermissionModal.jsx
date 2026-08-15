import { useEffect, useState } from "react";

import Modal from "../Modal/Modal";
import FormInput from "../FormInput/FormInput";
import Loading from "../Loading/Loading";

import permissionService from "../../services/permissionService";
import userService from "../../services/userService";

import "./PermissionModal.css";

export default function PermissionModal({
  isOpen,
  resourceId,
  resourceType,
  onClose,
}) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loginName, setLoginName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState(["read"]);

  useEffect(() => {
    if (!isOpen || !resourceId) {
      return;
    }
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

      setPermissions(response?.data || response || []);
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách quyền.");
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

  const handleGrant = async () => {
    if (!loginName.trim()) {
      setError("Vui lòng nhập tên đăng nhập.");
      return;
    }

    if (selectedPermissions.length === 0) {
      setError("Vui lòng chọn ít nhất một quyền.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const user = await userService.findByLoginName(loginName.trim());

      if (!user) {
        throw new Error("Không tìm thấy người dùng.");
      }
      await permissionService.grantPermission(
        user._id,
        resourceId,
        resourceType,
        selectedPermissions,
      );
      setLoginName("");
      setSelectedPermissions(["read"]);

      await loadPermissions();
    } catch (err) {
      setError(err?.message || "Không thể cấp quyền.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (permissionId, newPermissions) => {
    try {
      setSaving(true);
      setError("");

      await permissionService.updatePermission(permissionId, newPermissions);
      await loadPermissions();
    } catch (err) {
      setError(err?.message || "Không thể cập nhật quyền.");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (permissionId) => {
    try {
      setSaving(true);
      setError("");

      await permissionService.revokePermission(permissionId);
      await loadPermissions();
    } catch (err) {
      setError(err?.message || "Không thể thu hồi quyền.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} title="Quản lý quyền" onClose={onClose}>
      {error && <div className="error-message">{error}</div>}

      <div className="permission-modal">
        <div className="permission-modal__grant">
          <h3>Cấp quyền</h3>

          <FormInput
            label="Tên đăng nhập"
            name="loginName"
            value={loginName}
            onChange={(event) => setLoginName(event.target.value)}
            placeholder="Nhập tên đăng nhập"
            disabled={saving}
          />

          <div className="permission-modal__options">
            <label>
              <input
                type="checkbox"
                checked={selectedPermissions.includes("read")}
                onChange={() => handlePermissionChange("read")}
              />
              Xem
            </label>

            <label>
              <input
                type="checkbox"
                checked={selectedPermissions.includes("write")}
                onChange={() => handlePermissionChange("write")}
              />
              Chỉnh sửa
            </label>

            <label>
              <input
                type="checkbox"
                checked={selectedPermissions.includes("download")}
                onChange={() => handlePermissionChange("download")}
              />
              Download
            </label>

            <label>
              <input
                type="checkbox"
                checked={selectedPermissions.includes("delete")}
                onChange={() => handlePermissionChange("delete")}
              />
              Xóa
            </label>

            <label>
              <input
                type="checkbox"
                checked={selectedPermissions.includes("share")}
                onChange={() => handlePermissionChange("share")}
              />
              Chia sẻ
            </label>

            <label>
              <input
                type="checkbox"
                checked={selectedPermissions.includes("permission_management")}
                onChange={() => handlePermissionChange("permission_management")}
              />
              Quản lý quyền
            </label>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleGrant}
            disabled={saving}
          >
            {saving ? "Đang cấp..." : "Cấp quyền"}
          </button>
        </div>

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
                onUpdate={handleUpdate}
                onRevoke={handleRevoke}
              />
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

function PermissionItem({ permission, saving, onUpdate, onRevoke }) {
  const user = permission.user || {};
  const [selected, setSelected] = useState(permission.permissions || []);

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
        <strong>{user.login_name || "Người dùng"}</strong>

        <span>
          {user.first_name || ""} {user.last_name || ""}
        </span>
      </div>

      <div className="permission-item__permissions">
        {[
          "read",
          "write",
          "download",
          "delete",
          "share",
          "permission_management",
        ].map((permissionName) => (
          <label key={permissionName}>
            <input
              type="checkbox"
              checked={selected.includes(permissionName)}
              onChange={() => togglePermission(permissionName)}
              disabled={saving}
            />

            {permissionName}
          </label>
        ))}
      </div>

      <div className="permission-item__actions">
        <button
          className="btn btn-secondary"
          onClick={() => onUpdate(permission._id, selected)}
          disabled={saving || selected.length === 0}
        >
          Lưu
        </button>

        <button
          className="btn btn-danger"
          onClick={() => onRevoke(permission._id)}
          disabled={saving}
        >
          Thu hồi
        </button>
      </div>
    </div>
  );
}
