import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Loading from "../../components/Loading/Loading";
import FormInput from "../../components/FormInput/FormInput";

import shareService from "../../services/shareService";

import "./ShareAccess.css";

export default function ShareAccess() {
  const { token } = useParams();
  const [share, setShare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [needPassword, setNeedPassword] = useState(false);

  const loadShare = async (enteredPassword = null) => {
    try {
      setLoading(true);
      setError("");

      const response = await shareService.accessShare(token, enteredPassword);
      const data = response?.data || response;
      setShare(data);
      setNeedPassword(false);
    } catch (err) {
      if (err?.response?.status === 401) {
        setNeedPassword(true);
      } else {
        setError(err?.message || "Không thể truy cập Share Link.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadShare();
    }
  }, [token]);

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    loadShare(password);
  };

  const handlePreview = async () => {
    try {
      const response = await shareService.previewSharedFile(
        token,
        password || null,
      );
      const url = URL.createObjectURL(response.data);
      window.open(url, "_blank");
    } catch (err) {
      setError(err?.message || "Không thể Preview.");
    }
  };

  const handleDownload = async () => {
    try {
      const response = await shareService.downloadSharedFile(
        token,
        password || null,
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = share?.name || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.message || "Không thể Download.");
    }
  };

  if (loading) {
    return (
      <div className="share-access-page">
        <Loading message="Đang kiểm tra liên kết..." />
      </div>
    );
  }

  if (needPassword) {
    return (
      <div className="share-access-page">
        <div className="share-access-card">
          <div className="share-access-card__header">
            <h1>Liên kết được bảo vệ</h1>

            <p>Nhập mật khẩu để tiếp tục.</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form className="share-access-form" onSubmit={handlePasswordSubmit}>
            <FormInput
              label="Mật khẩu"
              name="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              required
            />

            <button className="btn btn-primary" type="submit">
              Truy cập
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="share-access-page">
        <div className="share-access-card">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="share-access-page">
      <div className="share-access-card">
        <div className="share-access-card__header">
          <div className="share-access-card__icon">🔗</div>

          <h1>{share?.name || "Tài nguyên được chia sẻ"}</h1>

          <p>{share?.resourceType === "folder" ? "Thư mục" : "Tệp"}</p>
        </div>

        <div className="share-access-card__info">
          {share?.expiresAt && (
            <div>
              Hết hạn: {new Date(share.expiresAt).toLocaleString("vi-VN")}
            </div>
          )}

          {share?.maxDownloads && (
            <div>
              Download: {share.downloadCount || 0}
              {" / "}
              {share.maxDownloads}
            </div>
          )}
        </div>

        <div className="share-access-card__actions">
          {share?.canPreview !== false && (
            <button className="btn btn-secondary" onClick={handlePreview}>
              Preview
            </button>
          )}

          {share?.canDownload !== false && (
            <button className="btn btn-primary" onClick={handleDownload}>
              Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
