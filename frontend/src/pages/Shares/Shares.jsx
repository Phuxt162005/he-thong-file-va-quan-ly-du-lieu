import { useEffect, useState } from "react";

import MainLayout from "../../layouts/MainLayout/MainLayout";
import Loading from "../../components/Loading/Loading";
import Modal from "../../components/Modal/Modal";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import FormInput from "../../components/FormInput/FormInput";

import shareService from "../../services/share.service";

import "./Shares.css";

export default function Shares() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedShare, setSelectedShare] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [revokeModal, setRevokeModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    expiresAt: "",
    password: "",
    maxDownloads: "",
    accessType: "public",
    permission: "view",
  });

  useEffect(() => {
    loadShares();
  }, [filter]);

  const loadShares = async () => {
    try {
      setLoading(true);
      setError("");

      const params = filter === "all" ? {} : { status: filter };
      const response = await shareService.getShares(params);

      setShares(response?.data || response || []);
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách Share Link.");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (share) => {
    setSelectedShare(share);
    setFormData({
      expiresAt: formatDateTime(share.expiresAt),
      password: "",
      maxDownloads: share.maxDownloads ?? "",
      accessType: share.accessType || "public",
      permission: share.permission || "view",
    });
    setEditModal(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!selectedShare) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const data = {
        expiresAt: formData.expiresAt || null,
        maxDownloads: formData.maxDownloads
          ? Number(formData.maxDownloads)
          : null,
        accessType: formData.accessType,
        permission: formData.permission,
      };

      if (formData.password) {
        data.password = formData.password;
      }

      const response = await shareService.updateShare(selectedShare._id, data);
      const updated = response?.data || response;

      setShares((prev) =>
        prev.map((share) =>
          share._id === selectedShare._id ? { ...share, ...updated } : share,
        ),
      );

      setEditModal(false);
      setSelectedShare(null);
    } catch (err) {
      setError(err?.message || "Không thể cập nhật Share Link.");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedShare) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await shareService.revokeShare(selectedShare._id);
      setShares((prev) =>
        prev.map((share) =>
          share._id === selectedShare._id
            ? { ...share, status: "revoked" }
            : share,
        ),
      );

      setRevokeModal(false);
      setSelectedShare(null);
    } catch (err) {
      setError(err?.message || "Không thể thu hồi Share Link.");
    } finally {
      setSaving(false);
    }
  };

  const copyShareLink = async (share) => {
    const url =
      share.url ||
      share.shareUrl ||
      (share.token ? `${window.location.origin}/share/${share.token}` : "");

    if (!url) {
      return;
    }
    await navigator.clipboard.writeText(url);
  };

  if (loading) {
    return (
      <MainLayout>
        <Loading message="Đang tải Share Link..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="shares-page">
        <div className="shares-page__header">
          <div>
            <h1>Liên kết chia sẻ</h1>

            <p>Quản lý các Share Link</p>
          </div>

          <select
            className="input shares-page__filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="expired">Đã hết hạn</option>
            <option value="revoked">Đã thu hồi</option>
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="shares-list">
          <div className="shares-list__header">
            <span>Tài nguyên</span>
            <span>Loại</span>
            <span>Hết hạn</span>
            <span>Download</span>
            <span>Trạng thái</span>
            <span>Thao tác</span>
          </div>

          {shares.length === 0 ? (
            <div className="shares-list__empty">Chưa có Share Link.</div>
          ) : (
            shares.map((share) => (
              <ShareItem
                key={share._id}
                share={share}
                onEdit={openEdit}
                onRevoke={(item) => {
                  setSelectedShare(item);
                  setRevokeModal(true);
                }}
                onCopy={copyShareLink}
              />
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={editModal}
        title="Chỉnh sửa Share Link"
        onClose={() => {
          if (!saving) {
            setEditModal(false);
            setSelectedShare(null);
          }
        }}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setEditModal(false);
                setSelectedShare(null);
              }}
              disabled={saving}
            >
              Hủy
            </button>

            <button
              className="btn btn-primary"
              onClick={handleUpdate}
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </>
        }
      >
        <div className="share-edit-form">
          <div className="share-edit-form__group">
            <label>Loại truy cập</label>

            <select
              className="input"
              name="accessType"
              value={formData.accessType}
              onChange={handleChange}
              disabled={saving}
            >
              <option value="public">Public</option>

              <option value="private">Private</option>
            </select>
          </div>

          <div className="share-edit-form__group">
            <label>Quyền truy cập</label>

            <select
              className="input"
              name="permission"
              value={formData.permission}
              onChange={handleChange}
              disabled={saving}
            >
              <option value="view">View only</option>

              <option value="edit">Edit</option>
            </select>
          </div>

          <FormInput
            label="Ngày hết hạn"
            name="expiresAt"
            type="datetime-local"
            value={formData.expiresAt}
            onChange={handleChange}
            disabled={saving}
          />

          <FormInput
            label="Mật khẩu mới"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Để trống nếu giữ nguyên"
            disabled={saving}
          />

          <FormInput
            label="Giới hạn Download"
            name="maxDownloads"
            type="number"
            value={formData.maxDownloads}
            onChange={handleChange}
            disabled={saving}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={revokeModal}
        title="Thu hồi Share Link"
        message={`Bạn có chắc muốn thu hồi Share Link của "${selectedShare?.resourceName || selectedShare?.name || ""}"?`}
        confirmText="Thu hồi"
        cancelText="Hủy"
        danger
        loading={saving}
        onConfirm={handleRevoke}
        onCancel={() => {
          if (!saving) {
            setRevokeModal(false);
            setSelectedShare(null);
          }
        }}
      />
    </MainLayout>
  );
}

function ShareItem({ share, onEdit, onRevoke, onCopy }) {
  const status = share.status || getStatus(share);

  return (
    <div className="share-item">
      <div className="share-item__resource">
        <span className="share-item__icon">🔗</span>

        <div>
          <strong>{share.resourceName || share.name || "Tài nguyên"}</strong>

          <span>{share.resourceType === "folder" ? "Folder" : "File"}</span>
        </div>
      </div>

      <div className="share-item__type">
        {share.accessType === "private" ? "Private" : "Public"}
      </div>

      <div className="share-item__expiry">
        {share.expiresAt
          ? new Date(share.expiresAt).toLocaleString("vi-VN")
          : "Không giới hạn"}
      </div>

      <div className="share-item__downloads">
        {share.downloadCount || 0}

        {share.maxDownloads ? ` / ${share.maxDownloads}` : " / ∞"}
      </div>

      <div>
        <span className={`share-status share-status--${status}`}>
          {getStatusText(status)}
        </span>
      </div>

      <div className="share-item__actions">
        <button className="btn btn-secondary" onClick={() => onCopy(share)}>
          Sao chép
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => onEdit(share)}
          disabled={status === "revoked"}
        >
          Sửa
        </button>

        <button
          className="btn btn-danger"
          onClick={() => onRevoke(share)}
          disabled={status === "revoked"}
        >
          Thu hồi
        </button>
      </div>
    </div>
  );
}

function getStatus(share) {
  if (share.status) {
    return share.status;
  }
  if (share.revoked) {
    return "revoked";
  }
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    return "expired";
  }
  return "active";
}

function getStatusText(status) {
  switch (status) {
    case "active":
      return "Đang hoạt động";
    case "expired":
      return "Đã hết hạn";
    case "revoked":
      return "Đã thu hồi";
    default:
      return status;
  }
}

function formatDateTime(date) {
  if (!date) {
    return "";
  }

  const value = new Date(date);
  const offset = value.getTimezoneOffset();
  const local = new Date(value.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}
