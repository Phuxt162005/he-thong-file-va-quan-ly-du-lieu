import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import FileItem from "../../components/FileItem/FileItem";
import FilePreview from "../../components/FilePreview/FilePreview";
import FileMoveDialog from "../../components/FileMoveDialog/FileMoveDialog";
import FileCopyDialog from "../../components/FileCopyDialog/FileCopyDialog";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import PermissionModal from "../../components/PermissionModal/PermissionModal";
import Loading from "../../components/Loading/Loading";
import ShareDialog from "../../components/ShareDialog/ShareDialog";

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
  const [downloadingId, setDownloadingId] = useState(null);
  const [permissionFile, setPermissionFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);

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
    if (!file?._id || downloadingId) {
      return;
    }

    let objectUrl = null;

    try {
      setDownloadingId(file._id);
      setError("");

      const response = await fileService.downloadFile(file._id);
      const blob = response.data;

      if (!(blob instanceof Blob)) {
        throw new Error("Dữ liệu download không hợp lệ.");
      }

      objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = file.name || "download";
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      const message = await getDownloadErrorMessage(err);
      setError(message);
    } finally {
      if (objectUrl) {
        // Chờ browser hoàn tất thao tác click trước khi giải phóng Blob URL.
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      }
      setDownloadingId(null);
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
              onPermission={setPermissionFile}
              onShare={setShareFile}
              downloading={downloadingId === file._id}
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

      <PermissionModal
        isOpen={Boolean(permissionFile)}
        resourceId={permissionFile?._id}
        resourceType="file"
        onClose={() => setPermissionFile(null)}
      />

      <ShareDialog
        resource={shareFile}
        isOpen={Boolean(shareFile)}
        onClose={() => setShareFile(null)}
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

async function getDownloadErrorMessage(error) {
  const response = error?.response;

  if (response?.data instanceof Blob) {
    try {
      const text = await response.data.text();
      const data = JSON.parse(text);
      if (data?.message) {
        return data.message;
      }
    } catch {
      // Response không phải JSON, dùng message mặc định bên dưới.
    }
  }

  return error?.message || "Không thể download file.";
}
