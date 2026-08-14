import { useEffect, useState } from "react";

import MainLayout from "../../layouts/MainLayout/MainLayout";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import Loading from "../../components/Loading/Loading";

import fileService from "../../services/fileService";

import "./Trash.css";

export default function Trash() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadTrash();
  }, []);

  const loadTrash = async () => {
    try {
      setLoading(true);
      const response = await fileService.getDeletedFiles();
      setFiles(response?.data || response || []);
    } catch (err) {
      setError(err?.message || "Không thể tải thùng rác.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) {
      return;
    }

    try {
      setRestoring(true);
      setError("");
      await fileService.restoreFile(selectedFile._id);
      setFiles((prev) => prev.filter((file) => file._id !== selectedFile._id));
      setSelectedFile(null);
    } catch (err) {
      setError(err?.message || "Không thể khôi phục file.");
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Loading message="Đang tải thùng rác..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="trash-page">
        <div className="trash-page__header">
          <h1>Thùng rác</h1>

          <p>Các file đã xóa</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="trash-list">
          {files.length === 0 ? (
            <div className="trash-list__empty">Thùng rác đang trống.</div>
          ) : (
            files.map((file) => (
              <div key={file._id} className="trash-item">
                <div className="trash-item__icon">📄</div>

                <div className="trash-item__info">
                  <strong>{file.name}</strong>

                  <span>
                    {file.deletedAt
                      ? new Date(file.deletedAt).toLocaleString("vi-VN")
                      : ""}
                  </span>
                </div>

                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedFile(file)}
                >
                  Khôi phục
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(selectedFile)}
        title="Khôi phục file"
        message={`Bạn có muốn khôi phục "${selectedFile?.name || ""}"?`}
        confirmText="Khôi phục"
        cancelText="Hủy"
        loading={restoring}
        onConfirm={handleRestore}
        onCancel={() => {
          if (!restoring) {
            setSelectedFile(null);
          }
        }}
      />
    </MainLayout>
  );
}
