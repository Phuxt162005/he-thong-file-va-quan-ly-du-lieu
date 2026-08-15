import { useRef, useState } from "react";

import fileService from "../../services/fileService";

import "./FileUpload.css";

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

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Vui lòng chọn file.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      for (const file of files) {
        const session = await fileService.initiateChunkUpload(file, folderId);
        const uploadId = session.uploadId;
        const chunkSize = session.chunkSize;
        const totalChunks = session.totalChunks;
        // kiểm tra Chunk đã tồn tại
        const status = await fileService.getChunkUploadStatus(uploadId);
        const receivedChunks = new Set(status.receivedChunks);

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
        await fileService.completeChunkUpload(uploadId);
      }
      setFiles([]);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
      if (onUploaded) {
        onUploaded();
      }
    } catch (err) {
      setError(err?.message || "Chunk Upload thất bại.");
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
