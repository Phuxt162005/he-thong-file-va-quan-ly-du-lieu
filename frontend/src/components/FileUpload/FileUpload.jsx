import { useRef, useState } from "react";

import fileService from "../../services/fileService";

import "./FileUpload.css";

const UPLOAD_SESSION_KEY = "active_upload_sessions";
const NORMAL_UPLOAD_LIMIT = 50 * 1024 * 1024;

function getSavedSessions() {
  try {
    return JSON.parse(localStorage.getItem(UPLOAD_SESSION_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUploadSession(key, session) {
  const sessions = getSavedSessions();
  sessions[key] = session;
  localStorage.setItem(UPLOAD_SESSION_KEY, JSON.stringify(sessions));
}

function getUploadSession(key) {
  const sessions = getSavedSessions();
  return sessions[key] || null;
}

function removeUploadSession(key) {
  const sessions = getSavedSessions();
  delete sessions[key];
  localStorage.setItem(UPLOAD_SESSION_KEY, JSON.stringify(sessions));
}

function createFileKey(file, folderId) {
  return [file.name, file.size, file.lastModified, folderId || "root"].join(
    "|",
  );
}

export default function FileUpload({ folderId = null, onUploaded }) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleSelectFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    setFiles(selected);
    setError("");
  };

  const updateProgress = (file, completed, total) => {
    const progress = Math.round((completed / total) * 100);

    setFiles((prev) =>
      prev.map((item) => {
        if (item === file) {
          //  File object không nên bị thay đổi trực tiếp. Tạo object mới để lưu progress cho UI.
          return Object.assign(file, { progress });
        }
        return item;
      }),
    );
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Vui lòng chọn file.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      for (const file of files) {
        // File nhỏ: Upload trực tiếp bằng Multipart.
        if (file.size <= NORMAL_UPLOAD_LIMIT) {
          await fileService.uploadFile(file, folderId, (event) => {
            if (event.total) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setFiles((prev) =>
                prev.map((item) => {
                  if (item === file) {
                    const updateProgress = (file, completed, total) => {
                      const progress = Math.round((completed / total) * 100);

                      setFiles((prev) =>
                        prev.map((item) => {
                          if (item === file) {
                            return { ...item, progress };
                          }
                          return item;
                        }),
                      );
                    };
                  }
                  return item;
                }),
              );
            }
          });
          continue;
        }

        // File lớn: sử dụng Chunk Upload.
        const sessionKey = createFileKey(file, folderId);
        let savedSession = getUploadSession(sessionKey);
        let uploadId;
        let chunkSize;
        let totalChunks;

        // Chưa có session
        if (!savedSession) {
          const session = await fileService.initiateChunkUpload(file, folderId);
          uploadId = session.uploadId;
          chunkSize = session.chunkSize;
          totalChunks = session.totalChunks;
          saveUploadSession(sessionKey, {
            uploadId,
            chunkSize,
            totalChunks,
            fileName: file.name,
            fileSize: file.size,
            folderId,
          });
        } else {
          // Có session cũ
          uploadId = savedSession.uploadId;
          chunkSize = savedSession.chunkSize;
          totalChunks = savedSession.totalChunks;
        }

        // Kiểm tra session trên Server
        let status = await fileService.getChunkUploadStatus(uploadId);
        // Session không còn tồn tại
        if (status.status !== "uploading") {
          removeUploadSession(sessionKey);
          const session = await fileService.initiateChunkUpload(file, folderId);
          uploadId = session.uploadId;
          chunkSize = session.chunkSize;
          totalChunks = session.totalChunks;
          saveUploadSession(sessionKey, {
            uploadId,
            chunkSize,
            totalChunks,
            fileName: file.name,
            fileSize: file.size,
            folderId,
          });
          status = await fileService.getChunkUploadStatus(uploadId);
        }

        // Các Chunk đã upload
        const receivedChunks = new Set(status.receivedChunks);

        // Upload các Chunk còn thiếu
        for (let index = 0; index < totalChunks; index++) {
          // Chunk đã tồn tại
          if (receivedChunks.has(index)) {
            updateProgress(file, index + 1, totalChunks);
            continue;
          }

          const start = index * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = file.slice(start, end);
          await fileService.uploadChunk(uploadId, index, chunk);

          pdateProgress(file, index + 1, totalChunks);
        }
        // Merge Chunk
        await fileService.completeChunkUpload(uploadId);
        // Upload hoàn tất
        removeUploadSession(sessionKey);
      }
      setFiles([]);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
      if (onUploaded) {
        onUploaded();
      }
    } catch (err) {
      // Không xóa Chunk Upload Session khi upload thất bại.
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Upload thất bại. Bạn có thể Upload lại để tiếp tục.",
      );
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    if (uploading) {
      return;
    }
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="file-upload">
      <div className="file-upload__select">
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleSelectFiles}
          disabled={uploading}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      {files.length > 0 && (
        <div className="file-upload__list">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="file-upload__item">
              <div className="file-upload__info">
                <span className="file-upload__name">{file.name}</span>

                <span className="file-upload__size">
                  {formatSize(file.size)}
                </span>
              </div>

              {uploading && (
                <div className="file-upload__progress">
                  <div
                    className="file-upload__progress-value"
                    style={{
                      width: `${file.progress || 0}%`,
                    }}
                  />
                </div>
              )}

              {!uploading && (
                <button
                  className="file-upload__remove"
                  onClick={() => removeFile(index)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
      >
        {uploading ? "Đang upload..." : "Upload"}
      </button>
    </div>
  );
}

function formatSize(bytes) {
  if (!bytes) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}
