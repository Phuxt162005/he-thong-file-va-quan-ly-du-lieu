import { useEffect, useState } from "react";

import Modal from "../Modal/Modal";
import FormInput from "../FormInput/FormInput";

import shareService from "../../services/shareService";

import "./ShareModal.css";

export default function ShareModal({
  isOpen,
  resourceId,
  resourceType,
  resourceName,
  onClose,
  onCreated,
}) {
  const [formData, setFormData] = useState({
    expiresAt: "",
    password: "",
    maxDownloads: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareResult, setShareResult] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData({
      expiresAt: "",
      password: "",
      maxDownloads: "",
      permission: "view",
    });
    setError("");
    setShareResult(null);
  }, [isOpen]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleCreate = async () => {
    if (!resourceId) {
      setError("Không xác định được tài nguyên cần chia sẻ.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const payload = {
        resourceId,
        resourceType,
        permission: formData.permission,
      };

      if (formData.expiresAt) {
        payload.expiresAt = formData.expiresAt;
      }
      if (formData.password) {
        payload.password = formData.password;
      }
      if (formData.maxDownloads) {
        payload.maxDownloads = Number(formData.maxDownloads);
      }

      const response = await shareService.createShare(payload);
      const data =
        response?.share || response?.data?.share || response?.data || response;
      setShareResult(data);
      if (onCreated) {
        onCreated(data);
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
    onClose();
  };

  const shareUrl =
    shareResult?.url ||
    shareResult?.shareUrl ||
    shareResult?.link ||
    (shareResult?.token
      ? `${window.location.origin}/share/${shareResult.token}`
      : "");

  return (
    <Modal
      isOpen={isOpen}
      title={shareResult ? "Share Link đã được tạo" : "Tạo Share Link"}
      onClose={handleClose}
      footer={
        shareResult ? (
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

      {!shareResult ? (
        <div className="share-form">
          <div className="share-resource">
            <span>Tài nguyên</span>
            <strong>{resourceName || "Không xác định"}</strong>
          </div>

          <FormInput
            label="Thời hạn"
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
            placeholder="Để trống nếu không cần mật khẩu"
            disabled={loading}
          />

          <FormInput
            label="Số lượt tải tối đa"
            name="maxDownloads"
            type="number"
            min="1"
            value={formData.maxDownloads}
            onChange={handleChange}
            placeholder="Để trống nếu không giới hạn"
            disabled={loading}
          />
        </div>
      ) : (
        <div className="share-result">
          <div className="share-result__success">
            <span>✓</span>

            <div>
              <strong>Tạo liên kết thành công</strong>
              <p>Bạn có thể sao chép liên kết bên dưới.</p>
            </div>
          </div>

          <div className="share-result__resource">{resourceName}</div>

          <div className="share-result__url">
            <input type="text" className="input" value={shareUrl} readOnly />

            <button
              className="btn btn-primary"
              onClick={() => copyToClipboard(shareUrl)}
              disabled={!shareUrl}
            >
              Sao chép
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

async function copyToClipboard(value) {
  if (!value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
  } catch (error) {
    console.error("Không thể sao chép Share Link:", error);
  }
}
