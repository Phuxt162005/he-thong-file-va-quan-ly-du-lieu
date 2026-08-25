import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Loading from "../../components/Loading/Loading";
import FormInput from "../../components/FormInput/FormInput";

import shareService from "../../services/shareService";

import "./ShareAccess.css";

export default function ShareAccess() {
  const { token } = useParams();
  const [share, setShare] = useState(null);
  const [folderData, setFolderData] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [needPassword, setNeedPassword] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState(null);

  // Kiểm tra Share Link
  const loadShare = async (enteredPassword = null) => {
    try {
      setLoading(true);
      setError("");
      const response = await shareService.accessShare(token, enteredPassword);
      setShare(response);
      setNeedPassword(false);

      // Nếu là Folder thì load nội dung Folder gốc.
      if (response.resourceType === "folder") {
        await loadFolder(response.resourceId, enteredPassword);
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "";
      if (message === "Password required" || message === "Invalid password") {
        setNeedPassword(true);
        if (message === "Invalid password") {
          setError("Mật khẩu không chính xác.");
        }
      } else {
        setError(message || "Không thể truy cập Share Link.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Lấy nội dung Folder
  const loadFolder = async (folderId, currentPassword = password) => {
    try {
      setLoading(true);
      setError("");

      let response;
      if (folderId === share?.resourceId) {
        response = await shareService.getSharedFolder(
          token,
          currentPassword || null,
        );
      } else {
        response = await shareService.getSharedFolderChildren(
          token,
          folderId,
          currentPassword || null,
        );

        /*
         * Backend getSharedFolderChildren trả children, còn root API trả folders.
         * Chuẩn hóa về cùng format.
         */
        response = {
          ...response,
          folders: response.folders || response.children || [],
          files: response.files || [],
        };
      }

      setFolderData(response);
      setCurrentFolderId(folderId);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "";
      setError(message || "Không thể tải thư mục.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadShare();
    }
  }, [token]);

  // Submit password
  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    loadShare(password);
  };

  // Download file trực tiếp
  const handleDownloadFile = async (file) => {
    try {
      setDownloadingFileId(file._id);
      setError("");

      const response = await shareService.downloadSharedFile(
        token,
        password || null,
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = url;
      link.download = file.name || file.fileName || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Không thể Download.",
      );
    } finally {
      setDownloadingFileId(null);
    }
  };

  // Download file bên trong Folder
  const handleDownloadFolderFile = async (file) => {
    try {
      setDownloadingFileId(file._id);
      setError("");

      const response = await shareService.downloadSharedFolderFile(
        token,
        file._id,
        password || null,
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = url;
      link.download = file.name || file.fileName || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Không thể Download.",
      );
    } finally {
      setDownloadingFileId(null);
    }
  };

  // Nếu đang loading
  if (loading && !share) {
    return (
      <div className="share-access-page">
        <Loading message="Đang kiểm tra liên kết..." />
      </div>
    );
  }

  // Yêu cầu password
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

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
            >
              Truy cập
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error && !share) {
    return (
      <div className="share-access-page">
        <div className="share-access-card">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  // Shared Folder
  if (share?.resourceType === "folder") {
    const folders = folderData?.folders || [];
    const files = folderData?.files || [];

    return (
      <div className="share-access-page">
        <div className="share-access-card share-access-card--wide">
          <div className="share-access-card__header">
            <div className="share-access-card__icon">📁</div>

            <h1>
              {folderData?.folder?.name ||
                share?.name ||
                "Thư mục được chia sẻ"}
            </h1>

            <p>Thư mục được chia sẻ</p>
          </div>

          {share?.expiresAt && (
            <div className="share-access-card__info">
              Hết hạn: {new Date(share.expiresAt).toLocaleString("vi-VN")}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="share-folder-content">
            <h2>Thư mục</h2>

            {folders.length === 0 && <p>Không có thư mục con.</p>}

            {folders.map((folder) => (
              <button
                key={folder._id}
                className="share-folder-item"
                onClick={() => loadFolder(folder._id, password)}
              >
                📁 {folder.name || "Folder"}
              </button>
            ))}

            <h2>Tệp</h2>

            {files.length === 0 && <p>Không có tệp.</p>}

            {files.map((file) => (
              <div key={file._id} className="share-file-item">
                <span>📄 {file.name || file.fileName || "File"}</span>

                <button
                  className="btn btn-primary"
                  disabled={downloadingFileId === file._id}
                  onClick={() => handleDownloadFolderFile(file)}
                >
                  {downloadingFileId === file._id ? "Đang tải..." : "Download"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Shared File
  return (
    <div className="share-access-page">
      <div className="share-access-card">
        <div className="share-access-card__header">
          <div className="share-access-card__icon">🔗</div>

          <h1>{share?.name || "Tệp được chia sẻ"}</h1>

          <p>Tệp</p>
        </div>

        <div className="share-access-card__info">
          {share?.expiresAt && (
            <div>
              Hết hạn: {new Date(share.expiresAt).toLocaleString("vi-VN")}
            </div>
          )}

          {share?.maxDownloads !== null &&
            share?.maxDownloads !== undefined && (
              <div>
                Download: {share.downloadCount || 0}
                {" / "}
                {share.maxDownloads}
              </div>
            )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="share-access-card__actions">
          <button
            className="btn btn-primary"
            onClick={() => handleDownloadFile(share)}
            disabled={downloadingFileId !== null}
          >
            {downloadingFileId ? "Đang tải..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}
