import { useRef, useState } from "react";

import fileService from "../../services/fileService";

import "./FileUpload.css";

const UPLOAD_SESSION_KEY = "active_upload_sessions";
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
        const sessionKey = createFileKey(file, folderId);
        // Kiểm tra xem file này đã có Upload Session trước đó chưa.
        let savedSession = getUploadSession(sessionKey);
        let uploadId;
        let chunkSize;
        let totalChunks;

        // nếu chưa có thì tạo Session mới
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
          // resume session cũ
          uploadId = savedSession.uploadId;
          chunkSize = savedSession.chunkSize;
          totalChunks = savedSession.totalChunks;
        }
        // lấy status từ server
        const status = await fileService.getChunkUploadStatus(uploadId);
        // nếu hết hạn thì tạo session mới
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
        }
        // lấy lại status sau khi có session mới
        const currentStatus = await fileService.getChunkUploadStatus(uploadId);
        const receivedChunks = new Set(currentStatus.receivedChunks);
        // upload chunk còn thiếu
        for (let index = 0; index < totalChunks; index++) {
          if (receivedChunks.has(index)) {
            updateProgress(file, index + 1, totalChunks);
            continue;
          }

          const start = index * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = file.slice(start, end);
          await fileService.uploadChunk(uploadId, index, chunk);
          updateProgress(file, index + 1, totalChunks);
        }
        // yêu cầu serve mới
        await fileService.completeChunkUpload(uploadId);
        // xóa session sau khi hoàn tất
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
      // Không xóa Upload Session khi upload thất bại, lần upload tiếp theo sẽ dùng lại session này.
      setError(
        err?.message || "Upload thất bại. Bạn có thể Upload lại để tiếp tục.",
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
