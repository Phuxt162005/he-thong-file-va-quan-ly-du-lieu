import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Loading from "../../components/Loading/Loading";
import FormInput from "../../components/FormInput/FormInput";
import FilePreview from "../../components/FilePreview/FilePreview";

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
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Kiểm tra Share Link
  const loadShare = async (enteredPassword = null) => {
    if (enteredPassword !== null) {
      setPassword(enteredPassword);
    }

    try {
      setLoading(true);
      setError("");
      const response = await shareService.accessShare(token, enteredPassword);
      setShare(response);
      setNeedPassword(false);

      // Nếu là Folder thì load nội dung Folder gốc.
      if (response.resourceType === "folder") {
        const folderResponse = await shareService.getSharedFolder(
          token,
          enteredPassword || null,
        );
        setFolderData(folderResponse);
        setCurrentFolderId(response.resourceId);
      }
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.message || "";
      if (status === 400 && message === "Password required") {
        setNeedPassword(true);
        setError("");
        return;
      }
      if (status === 400 && message === "Invalid password") {
        setNeedPassword(true);
        setError("Mật khẩu không chính xác.");
        return;
      }
      if (status === 401) {
        setError("Share Link này là Private. Vui lòng đăng nhập để truy cập.");
      } else if (status === 403) {
        setError("Bạn không có quyền truy cập Share Link này.");
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

      const response = await shareService.getSharedFolderChildren(
        token,
        folderId,
        currentPassword || null,
      );

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

  const handlePreviewFile = async (file) => {
    try {
      setPreviewLoading(true);
      setError("");

      const response = await shareService.previewSharedFile(
        token,
        password || null,
      );
      if (!(response?.data instanceof Blob)) {
        throw new Error("Dữ liệu preview không hợp lệ.");
      }
      const url = URL.createObjectURL(response.data);

      setPreviewUrl(url);
      setPreviewFile(file);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể Preview file.",
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewFile(null);
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
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.message || "";
      if (status === 403) {
        setError(message || "Share Link này không cho phép Download.");
      } else if (status === 404) {
        setError("Tài nguyên được chia sẻ không còn tồn tại.");
      } else if (status === 400) {
        setError(message || "Share Link không còn khả dụng.");
      } else {
        setError(message || "Không thể Download.");
      }
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
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.message || "";
      if (status === 403) {
        setError(message || "Share Link này không cho phép Download.");
      } else if (status === 404) {
        setError("Tài nguyên được chia sẻ không còn tồn tại.");
      } else if (status === 400) {
        setError(message || "Share Link không còn khả dụng.");
      } else {
        setError(message || "Không thể Download.");
      }
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

          <div className="share-access-card__info">
            <div>
              {share?.visibility === "private" ? "🔒 Private" : "🌐 Public"}
            </div>

            <div>
              {share?.accessType === "view"
                ? "👁 View Only"
                : "⬇️ Cho phép Download"}
            </div>

            {share?.expiresAt && (
              <div>
                Hết hạn: {new Date(share.expiresAt).toLocaleString("vi-VN")}
              </div>
            )}
          </div>

          <div className="share-folder-content">
            {loading && <Loading message="Đang tải thư mục..." />}

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

            <div className="share-access-card__info">
              <div>
                {share?.visibility === "private" ? "🔒 Private" : "🌐 Public"}
              </div>

              <div>
                {share?.accessType === "view"
                  ? "👁 View Only"
                  : "⬇️ Cho phép Download"}
              </div>

              {share?.expiresAt && (
                <div>
                  Hết hạn: {new Date(share.expiresAt).toLocaleString("vi-VN")}
                </div>
              )}
            </div>

            <div className="share-files">
              {files.map((file) => (
                <div key={file._id} className="share-file-item">
                  <span>📄 {file.name || file.fileName || "File"}</span>

                  {share?.accessType === "view" ? (
                    <span className="share-file-item__view-only">
                      👁 Chỉ xem
                    </span>
                  ) : (
                    <button
                      className="btn btn-primary"
                      disabled={downloadingFileId === file._id}
                      onClick={() => handleDownloadFolderFile(file)}
                    >
                      {downloadingFileId === file._id
                        ? "Đang tải..."
                        : "Download"}
                    </button>
                  )}
                </div>
              ))}
            </div>
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
          {share?.accessType === "view" ? (
            <div className="share-access-card__view-only">
              👁 Chế độ View Only — không cho phép Download
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => handleDownloadFile(share)}
              disabled={downloadingFileId !== null}
            >
              {downloadingFileId ? "Đang tải..." : "Download"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
