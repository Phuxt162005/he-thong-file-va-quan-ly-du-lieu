import { useEffect, useState } from "react";

import Loading from "../../components/Loading/Loading";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";

import fileService from "../../services/fileService";
import folderService from "../../services/folderService";

import "./Trash.css";

export default function Trash() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [restoreModal, setRestoreModal] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [restoreFolderModal, setRestoreFolderModal] = useState(false);

  const openRestoreFolderModal = (folder) => {
    setSelectedFolder(folder);
    setRestoreFolderModal(true);
  };

  const handleRestoreFolder = async () => {
    if (!selectedFolder?._id) {
      return;
    }

    try {
      setRestoring(true);
      setError("");

      await folderService.restoreFolder(selectedFolder._id);
      setFolders((prev) =>
        prev.filter((folder) => folder._id !== selectedFolder._id),
      );

      setRestoreFolderModal(false);
      setSelectedFolder(null);
    } catch (err) {
      setError(err?.message || "Không thể khôi phục thư mục.");
    } finally {
      setRestoring(false);
    }
  };

  const loadTrash = async () => {
    try {
      setLoading(true);
      setError("");

      const [fileResponse, folderResponse] = await Promise.all([
        fileService.getDeletedFiles(),
        folderService.getDeletedFolders(),
      ]);
      const fileData = fileResponse?.data || fileResponse || [];
      const folderData = folderResponse?.data || folderResponse || [];

      setFiles(Array.isArray(fileData) ? fileData : fileData.files || []);
      setFolders(
        Array.isArray(folderData) ? folderData : folderData.folders || [],
      );
    } catch (err) {
      setError(err?.message || "Không thể tải Thùng rác.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

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
    return <Loading message="Đang tải Thùng rác..." />;
  }

  return (
    <div className="trash-page">
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

      <ConfirmDialog
        isOpen={restoreFolderModal}
        title="Khôi phục thư mục"
        message={`Bạn có chắc muốn khôi phục thư mục "${selectedFolder?.name || ""}"?`}
        confirmText="Khôi phục"
        cancelText="Hủy"
        loading={restoring}
        onConfirm={handleRestoreFolder}
        onCancel={() => {
          if (!restoring) {
            setRestoreFolderModal(false);
            setSelectedFolder(null);
          }
        }}
      />

      {/* Header */}
      <div className="trash-page__header">
        <div>
          <h1>Thùng rác</h1>
          <p>Các file đã bị xóa khỏi thư mục hiện tại</p>
        </div>

        <button className="btn btn-secondary" onClick={loadTrash}>
          Làm mới
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Trash list */}
      <div className="trash-card">
        {files.length === 0 && folders.length === 0 ? (
          <div className="trash-empty">
            <div className="trash-empty__icon">🗑️</div>
            <h2>Thùng rác trống</h2>
            <p>Không có file hoặc thư mục nào đã bị xóa.</p>
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

            {folders.map((folder) => (
              <TrashFolderItem
                key={`folder-${folder._id}`}
                folder={folder}
                onRestore={openRestoreFolderModal}
              />
            ))}

            {files.map((file) => (
              <TrashItem
                key={`file-${file._id}`}
                file={file}
                onRestore={openRestoreModal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
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
        {file.folder?.name ||
          file.folderName ||
          file.parentFolderName ||
          "Thư mục không tồn tại"}
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

function TrashFolderItem({ folder, onRestore }) {
  return (
    <div className="trash-item">
      <div className="trash-item__name">
        <div className="trash-item__icon">📁</div>

        <div className="trash-item__info">
          <strong title={folder.name}>{folder.name || "Không có tên"}</strong>
          <span>Thư mục</span>
        </div>
      </div>

      <div className="trash-item__size">—</div>

      <div className="trash-item__folder">Thư mục</div>

      <div className="trash-item__date">{formatDate(folder.updatedAt)}</div>

      <div className="trash-item__actions">
        <button className="btn btn-primary" onClick={() => onRestore(folder)}>
          Khôi phục
        </button>
      </div>
    </div>
  );
}
