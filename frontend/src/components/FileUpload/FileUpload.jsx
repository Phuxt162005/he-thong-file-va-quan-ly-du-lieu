import { useRef, useState } from "react";

import fileService from "../../services/fileService";

import "./FileUpload.css";

const NORMAL_UPLOAD_LIMIT = 50 * 1024 * 1024;

export default function FileUpload({ folderId = null, onUploaded }) {
  const inputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSelectFiles = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    setFiles(
      selectedFiles.map((file) => ({
        file,
        progress: 0,
        status: "pending",
        error: "",
      })),
    );
    setError("");
    setSuccess("");
  };

  const updateFileState = (file, changes) => {
    setFiles((prev) =>
      prev.map((item) =>
        item.file === file ? { ...item, ...changes } : item,
      ),
    );
  };

  const uploadNormalFile = async (file) => {
    updateFileState(file, { status: "uploading", progress: 0, error: "" });

    await fileService.uploadFile(file, folderId, (event) => {
      if (!event.total) return;

      updateFileState(file, {
        progress: Math.round((event.loaded / event.total) * 100),
      });
    });

    updateFileState(file, { status: "success", progress: 100 });
  };

  const uploadChunkedFile = async (file) => {
    updateFileState(file, { status: "uploading", progress: 0, error: "" });

    const session = await fileService.initiateChunkUpload(file, folderId);
    const { uploadId, chunkSize, totalChunks } = session;

    for (let index = 0; index < totalChunks; index += 1) {
      const start = index * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      await fileService.uploadChunk(uploadId, index, chunk);

      updateFileState(file, {
        progress: Math.round(((index + 1) / totalChunks) * 100),
      });
    }

    await fileService.completeChunkUpload(uploadId);
    updateFileState(file, { status: "success", progress: 100 });
  };

  const uploadSingleFile = async (file) => {
    try {
      if (file.size === 0) {
        throw new Error("Không thể upload file rỗng.");
      }

      if (file.size <= NORMAL_UPLOAD_LIMIT) {
        await uploadNormalFile(file);
      } else {
        await uploadChunkedFile(file);
      }

      return true;
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Upload thất bại.";

      updateFileState(file, { status: "error", error: message });
      return false;
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Vui lòng chọn file.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    let successCount = 0;
    let failedCount = 0;

    try {
      for (const item of files) {
        const success = await uploadSingleFile(item.file);
        if (success) successCount += 1;
        else failedCount += 1;
      }

      if (successCount > 0) {
        setSuccess(`Upload thành công ${successCount} file${successCount > 1 ? "s" : ""}.`);
        onUploaded?.();
      }

      if (failedCount > 0) {
        setError(`Có ${failedCount} file upload thất bại.`);
      }

      if (failedCount === 0) {
        setFiles([]);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeFile = (index) => {
    if (uploading) return;
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    if (uploading) return;
    setFiles([]);
    setError("");
    setSuccess("");
    if (inputRef.current) inputRef.current.value = "";
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
      {success && <div className="success-message">{success}</div>}

      {files.length > 0 && (
        <div className="file-upload__list">
          {files.map((item, index) => (
            <div
              key={`${item.file.name}-${item.file.lastModified}-${index}`}
              className={`file-upload__item file-upload__item--${item.status}`}
            >
              <div className="file-upload__info">
                <span className="file-upload__name">{item.file.name}</span>
                <span className="file-upload__size">{formatSize(item.file.size)}</span>
                {item.status === "error" && item.error && (
                  <span className="file-upload__error">{item.error}</span>
                )}
              </div>

              <div className="file-upload__status">
                {item.status === "uploading" && <span>{item.progress}%</span>}
                {item.status === "success" && <span>✓ Thành công</span>}
                {item.status === "error" && <span>✗ Thất bại</span>}
                {item.status === "pending" && <span>Chờ upload</span>}
              </div>

              {item.status === "uploading" && (
                <div className="file-upload__progress">
                  <div
                    className="file-upload__progress-value"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              {!uploading && (
                <button
                  type="button"
                  className="file-upload__remove"
                  onClick={() => removeFile(index)}
                  aria-label={`Xóa ${item.file.name}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="file-upload__actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
        >
          {uploading ? "Đang upload..." : "Upload"}
        </button>

        {!uploading && files.length > 0 && (
          <button type="button" className="btn btn-secondary" onClick={clearFiles}>
            Xóa danh sách
          </button>
        )}
      </div>
    </div>
  );
}

function formatSize(bytes) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}
