import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import FileItem from "../../components/FileItem/FileItem";
import FilePreview from "../../components/FilePreview/FilePreview";
import FileMoveDialog from "../../components/FileMoveDialog/FileMoveDialog";
import FileCopyDialog from "../../components/FileCopyDialog/FileCopyDialog";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import Loading from "../../components/Loading/Loading";

import fileService from "../../services/fileService";

export default function FileList() {
  const [searchParams] = useSearchParams();
  const folderId = searchParams.get("folder");
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [moveFile, setMoveFile] = useState(null);
  const [copyFile, setCopyFile] = useState(null);
  const [deleteFile, setDeleteFile] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [folderId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fileService.getFiles(folderId);
      setFiles(response?.data || response || []);
      setSelectedFiles([]);
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách file.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (file, checked) => {
    setSelectedFiles((prev) => {
      if (checked) {
        return [...prev, file._id];
      }
      return prev.filter((id) => id !== file._id);
    });
  };

  const handleDownload = async (file) => {
    try {
      const response = await fileService.downloadFile(file._id);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.message || "Không thể download file.");
    }
  };

  const handleDelete = async () => {
    if (!deleteFile) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      await fileService.deleteFile(deleteFile._id);
      setFiles((prev) => prev.filter((file) => file._id !== deleteFile._id));
      setDeleteFile(null);
    } catch (err) {
      setError(err?.message || "Không thể xóa file.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loading message="Đang tải file..." />;
  }

  return (
    <>
      {error && <div className="error-message">{error}</div>}

      <div className="file-list">
        <div className="file-list__header">
          <div>Chọn</div>
          <div>File</div>
          <div>Tên</div>
          <div>Dung lượng</div>
          <div>Cập nhật</div>
          <div>Thao tác</div>
        </div>

        {files.length === 0 ? (
          <div className="file-list__empty">Chưa có file.</div>
        ) : (
          files.map((file) => (
            <FileItem
              key={file._id}
              file={file}
              selected={selectedFiles.includes(file._id)}
              onSelect={handleSelect}
              onDownload={handleDownload}
              onPreview={setPreviewFile}
              onMove={setMoveFile}
              onCopy={setCopyFile}
              onDelete={setDeleteFile}
            />
          ))
        )}
      </div>

      <FilePreview
        file={previewFile}
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
      />

      <FileMoveDialog
        file={moveFile}
        isOpen={Boolean(moveFile)}
        onClose={() => setMoveFile(null)}
        onMoved={loadFiles}
      />

      <FileCopyDialog
        file={copyFile}
        isOpen={Boolean(copyFile)}
        onClose={() => setCopyFile(null)}
        onCopied={loadFiles}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteFile)}
        title="Xóa file"
        message={`Bạn có chắc muốn xóa "${deleteFile?.name || ""}"?`}
        confirmText="Xóa"
        cancelText="Hủy"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) {
            setDeleteFile(null);
          }
        }}
      />
    </>
  );
}
