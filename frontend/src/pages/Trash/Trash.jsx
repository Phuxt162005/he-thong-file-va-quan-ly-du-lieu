import { useEffect, useState } from "react";

import MainLayout from "../../layouts/MainLayout/MainLayout";
import Loading from "../../components/Loading/Loading";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";

import fileService from "../../services/fileService";

import "./Trash.css";

export default function Trash() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [restoreModal, setRestoreModal] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadDeletedFiles();
  }, []);

  const loadDeletedFiles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fileService.getDeletedFiles();
      const data = response?.data || response || [];

      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Không thể tải Thùng rác.");
    } finally {
      setLoading(false);
    }
  };

  const openRestoreModal = (file) => {
    setSelectedFile(file);
    setRestoreModal(true);
  };

  const closeRestoreModal = () => {
    if (restoring) {
      return;
    }

    setRestoreModal(false);
    setSelectedFile(null);
  };

  const handleRestore = async () => {
    if (!selectedFile?._id) {
      return;
    }

    try {
      setRestoring(true);
      setError("");
      await fileService.restoreFile(selectedFile._id);
      setFiles((prev) => prev.filter((file) => file._id !== selectedFile._id));
      closeRestoreModal();
    } catch (err) {
      setError(err?.message || "Không thể khôi phục file.");
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Loading message="Đang tải Thùng rác..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="trash-page">
        {/* Header */}
        <div className="trash-page__header">
          <div>
            <h1>Thùng rác</h1>
            <p>Các file đã bị xóa khỏi thư mục hiện tại</p>
          </div>

          <button className="btn btn-secondary" onClick={loadDeletedFiles}>
            Làm mới
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Trash list */}
        <div className="trash-card">
          {files.length === 0 ? (
            <div className="trash-empty">
              <div className="trash-empty__icon">🗑️</div>
              <h2>Thùng rác trống</h2>
              <p>Không có file nào đã bị xóa.</p>
            </div>
          ) : (
            <div className="trash-list">
              <div className="trash-list__header">
                <span>Tệp</span>
                <span>Kích thước</span>
                <span>Thư mục cũ</span>
                <span>Ngày xóa</span>
                <span>Thao tác</span>
              </div>

              {files.map((file) => (
                <TrashItem
                  key={file._id}
                  file={file}
                  onRestore={openRestoreModal}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Restore confirmation */}
      <ConfirmDialog
        isOpen={restoreModal}
        title="Khôi phục file"
        message={`Bạn có chắc muốn khôi phục file "${selectedFile?.name || ""}"?`}
        confirmText="Khôi phục"
        cancelText="Hủy"
        loading={restoring}
        onConfirm={handleRestore}
        onCancel={closeRestoreModal}
      />
    </MainLayout>
  );
}

function TrashItem({ file, onRestore }) {
  return (
    <div className="trash-item">
      <div className="trash-item__name">
        <div className="trash-item__icon">{getFileIcon(file.name)}</div>

        <div className="trash-item__info">
          <strong title={file.name}>{file.name || "Không có tên"}</strong>
          <span>{file.mimeType || "File"}</span>
        </div>
      </div>

      <div className="trash-item__size">{formatStorage(file.size)}</div>

      <div className="trash-item__folder">
        {file.folderName || file.parentFolderName || "Thư mục không tồn tại"}
      </div>

      <div className="trash-item__date">{formatDate(file.deletedAt)}</div>

      <div className="trash-item__actions">
        <button className="btn btn-primary" onClick={() => onRestore(file)}>
          Khôi phục
        </button>
      </div>
    </div>
  );
}

function getFileIcon(name = "") {
  const extension = name.split(".").pop().toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
    return "🖼️";
  }
  if (extension === "pdf") {
    return "📕";
  }
  if (["doc", "docx"].includes(extension)) {
    return "📘";
  }
  if (["xls", "xlsx"].includes(extension)) {
    return "📗";
  }
  if (["ppt", "pptx"].includes(extension)) {
    return "📙";
  }
  if (["zip", "rar", "7z"].includes(extension)) {
    return "🗜️";
  }
  if (["mp4", "avi", "mkv", "mov"].includes(extension)) {
    return "🎬";
  }
  if (["mp3", "wav"].includes(extension)) {
    return "🎵";
  }
  return "📄";
}

function formatStorage(bytes) {
  if (!bytes || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(2)} ${units[index]}`;
}

function formatDate(date) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleString("vi-VN");
}
