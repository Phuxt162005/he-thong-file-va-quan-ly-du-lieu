import { useState } from "react";

import Modal from "../Modal/Modal";
import FormInput from "../FormInput/FormInput";

import shareService from "../../services/shareService";

import "./ShareDialog.css";

export default function ShareDialog({ resource, isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    expiresAt: "",
    password: "",
    maxDownloads: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdShare, setCreatedShare] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleCreate = async () => {
    if (!resource?._id) {
      setError("Không xác định được tài nguyên.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = {
        resourceId: resource._id,
        resourceType: resource.type || "file",
        expiresAt: formData.expiresAt || null,
        password: formData.password || null,
        maxDownloads: formData.maxDownloads
          ? Number(formData.maxDownloads)
          : null,
      };
      const response = await shareService.createShare(data);
      const share =
        response?.share || response?.data?.share || response?.data || response;
      setCreatedShare(share);

      if (onCreated) {
        onCreated(share);
      }
    } catch (err) {
      setError(err?.message || "Không thể tạo Share Link.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) {
      return;
    }

    setCreatedShare(null);
    setFormData({
      expiresAt: "",
      password: "",
      maxDownloads: "",
      accessType: "public",
      permission: "view",
    });
    setError("");
    onClose();
  };

  const shareUrl =
    createdShare?.url ||
    createdShare?.shareUrl ||
    (createdShare?.token
      ? `${window.location.origin}/share/${createdShare.token}`
      : "");

  return (
    <Modal
      isOpen={isOpen}
      title="Chia sẻ"
      onClose={handleClose}
      footer={
        createdShare ? (
          <button className="btn btn-primary" onClick={handleClose}>
            Đóng
          </button>
        ) : (
          <>
            <button
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </button>

            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? "Đang tạo..." : "Tạo liên kết"}
            </button>
          </>
        )
      }
    >
      {error && <div className="error-message">{error}</div>}

      {createdShare ? (
        <div className="share-created">
          <div className="success-message">Tạo Share Link thành công.</div>

          <div className="share-created__url">
            <input className="input" value={shareUrl} readOnly />

            <button
              className="btn btn-secondary"
              onClick={() => navigator.clipboard.writeText(shareUrl)}
            >
              Sao chép
            </button>
          </div>
        </div>
      ) : (
        <div className="share-form">
          <div className="share-form__resource">
            <span>Tài nguyên:</span>

            <strong>{resource?.name}</strong>
          </div>

          <div className="share-form__group">
            <label>Loại truy cập</label>

            <select
              className="input"
              name="accessType"
              value={formData.accessType}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="public">Public</option>

              <option value="private">Private</option>
            </select>
          </div>

          <div className="share-form__group">
            <label>Quyền truy cập</label>

            <select
              className="input"
              name="permission"
              value={formData.permission}
              onChange={handleChange}
              disabled={loading}
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
            disabled={loading}
          />

          <FormInput
            label="Mật khẩu"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Để trống nếu không dùng"
            disabled={loading}
          />

          <FormInput
            label="Giới hạn Download"
            name="maxDownloads"
            type="number"
            value={formData.maxDownloads}
            onChange={handleChange}
            placeholder="Để trống nếu không giới hạn"
            disabled={loading}
          />
        </div>
      )}
    </Modal>
  );
}
