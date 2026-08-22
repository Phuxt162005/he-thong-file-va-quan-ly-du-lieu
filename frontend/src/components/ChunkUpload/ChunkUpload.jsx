import { useRef, useState } from "react";

import chunkUploadService from "../../services/chunkUploadService";

import "./ChunkUpload.css";

export default function ChunkUpload({ folderId = null, onUploaded }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      return;
    }

    setFile(selected);
    setProgress(0);
    setError("");
    setSuccess("");
  };

  const handleUpload = async () => {
    if (!file || uploading) {
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");
      setProgress(0);
      await chunkUploadService.upload(file, folderId, {
        onProgress: setProgress,
      });
      setProgress(100);
      setSuccess("Upload file thành công.");
      onUploaded?.();
      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }
      setError(err?.message || "Upload file thất bại.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="chunk-upload">
      <input
        ref={inputRef}
        type="file"
        disabled={uploading}
        onChange={handleFileChange}
      />

      {file && (
        <div className="chunk-upload__file">
          <strong>{file.name}</strong>

          <span>{formatBytes(file.size)}</span>
        </div>
      )}

      {uploading && (
        <div className="chunk-upload__progress">
          <div className="chunk-upload__progress-bar">
            <div
              className="chunk-upload__progress-value"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <span>{progress}%</span>
        </div>
      )}

      {error && <div className="chunk-upload__error">{error}</div>}
      {success && <div className="chunk-upload__success">{success}</div>}

      <button
        type="button"
        className="btn btn-primary"
        disabled={!file || uploading}
        onClick={handleUpload}
      >
        {uploading ? `Đang upload ${progress}%` : "Upload"}
      </button>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 2,
  )} ${units[index]}`;
}
