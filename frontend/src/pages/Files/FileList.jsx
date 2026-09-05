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
import Modal from "../../components/Modal/Modal";
import FormInput from "../../components/FormInput/FormInput";

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
  const [renameFile, setRenameFile] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkMove, setBulkMove] = useState(false);
  const [bulkCopy, setBulkCopy] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [bulkDestinationFolderId, setBulkDestinationFolderId] = useState(null);

  useEffect(() => {
    loadFiles();
  }, [folderId]);

  useEffect(() => {
    function closeContextMenu() {
      setContextMenu(null);
    }
    document.addEventListener("click", closeContextMenu);

    return () => {
      document.removeEventListener("click", closeContextMenu);
    };
  }, []);

  async function loadFiles() {
    try {
      setLoading(true);
      setError("");

      const response = await fileService.getFiles(folderId);
      const data = response?.files || response?.data || response || [];

      setFiles(Array.isArray(data) ? data : []);

      setSelectedFiles([]);
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách file.");
    } finally {
      setLoading(false);
    }
  }

  function refreshFiles() {
    loadFiles();
  }

  function handleSelect(file, checked) {
    setSelectedFiles((prev) => {
      if (checked) {
        if (prev.includes(file._id)) {
          return prev;
        }
        return [...prev, file._id];
      }
      return prev.filter((id) => id !== file._id);
    });
  }

  function handleSelectAll(checked) {
    if (checked) {
      setSelectedFiles(files.map((file) => file._id));
    } else {
      setSelectedFiles([]);
    }
  }

  function isAllSelected() {
    return files.length > 0 && selectedFiles.length === files.length;
  }

  async function handleDownload(file) {
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
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      }
      setDownloadingId(null);
    }
  }

  function openRename(file) {
    setRenameFile(file);
    setRenameValue(file.name || "");
    setError("");
  }

  function validateFileName(value) {
    const name = value.trim();
    if (!name) {
      return "Tên file không được để trống.";
    }
    if (name.length > 255) {
      return "Tên file không được vượt quá 255 ký tự.";
    }
    if (/[<>:"/\\|?*\x00-\x1F]/.test(name)) {
      return "Tên file chứa ký tự không hợp lệ.";
    }
    return "";
  }

  async function handleRename() {
    if (!renameFile) {
      return;
    }

    const validationError = validateFileName(renameValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setRenaming(true);
      setError("");

      await fileService.renameFile(renameFile._id, renameValue.trim());

      setRenameFile(null);
      setRenameValue("");

      refreshFiles();
    } catch (err) {
      setError(err?.message || "Không thể đổi tên file.");
    } finally {
      setRenaming(false);
    }
  }

  async function handleDelete() {
    if (!deleteFile) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await fileService.deleteFile(deleteFile._id);

      setDeleteFile(null);

      refreshFiles();
    } catch (err) {
      setError(err?.message || "Không thể xóa file.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleBulkDelete() {
    if (!selectedFiles.length) {
      return;
    }

    try {
      setBulkDeleting(true);
      setError("");

      for (const fileId of selectedFiles) {
        await fileService.deleteFile(fileId);
      }

      setSelectedFiles([]);
      setBulkDelete(false);

      refreshFiles();
    } catch (err) {
      setError(err?.message || "Không thể xóa một hoặc nhiều file.");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleBulkMove(destinationFolderId) {
    if (!selectedFiles.length) {
      return;
    }

    try {
      setBulkProcessing(true);
      setError("");

      for (const fileId of selectedFiles) {
        await fileService.moveFile(fileId, destinationFolderId);
      }

      setSelectedFiles([]);
      setBulkMove(false);

      refreshFiles();
    } catch (err) {
      setError(err?.message || "Không thể di chuyển một hoặc nhiều file.");
    } finally {
      setBulkProcessing(false);
    }
  }

  async function handleBulkCopy(destinationFolderId) {
    if (!selectedFiles.length) {
      return;
    }

    try {
      setBulkProcessing(true);
      setError("");

      for (const fileId of selectedFiles) {
        await fileService.copyFile(fileId, destinationFolderId);
      }

      setSelectedFiles([]);
      setBulkCopy(false);

      refreshFiles();
    } catch (err) {
      setError(err?.message || "Không thể sao chép một hoặc nhiều file.");
    } finally {
      setBulkProcessing(false);
    }
  }

  function openContextMenu(event, file) {
    event.preventDefault();

    setContextMenu({
      file,
      x: event.clientX,
      y: event.clientY,
    });
  }

  if (loading) {
    return <Loading message="Đang tải file..." />;
  }

  return (
    <>
      {error && <div className="error-message">{error}</div>}

      {selectedFiles.length > 0 && (
        <div className="file-list__toolbar">
          <span>
            Đã chọn <strong>{selectedFiles.length}</strong> file
          </span>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setBulkMove(true)}
            disabled={bulkProcessing}
          >
            📂 Di chuyển
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setBulkCopy(true)}
            disabled={bulkProcessing}
          >
            📋 Sao chép
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setBulkDelete(true)}
          >
            🗑️ Xóa đã chọn
          </button>
        </div>
      )}

      <div className="file-list">
        <div className="file-list__header">
          <div>
            <input
              type="checkbox"
              checked={isAllSelected()}
              onChange={(event) => handleSelectAll(event.target.checked)}
            />
          </div>

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
              onRename={openRename}
              onMove={setMoveFile}
              onCopy={setCopyFile}
              onDelete={setDeleteFile}
              onPermission={setPermissionFile}
              onShare={setShareFile}
              onContextMenu={openContextMenu}
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
        onMoved={() => {
          setMoveFile(null);
          refreshFiles();
        }}
      />

      <FileCopyDialog
        file={copyFile}
        isOpen={Boolean(copyFile)}
        onClose={() => setCopyFile(null)}
        onCopied={() => {
          setCopyFile(null);
          refreshFiles();
        }}
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

      <Modal
        isOpen={bulkMove}
        title="Di chuyển các file đã chọn"
        onClose={() => {
          if (!bulkProcessing) {
            setBulkMove(false);
            setBulkDestinationFolderId(null);
          }
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setBulkMove(false);
                setBulkDestinationFolderId(null);
              }}
              disabled={bulkProcessing}
            >
              Hủy
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleBulkMove(bulkDestinationFolderId)}
              disabled={bulkProcessing || bulkDestinationFolderId === undefined}
            >
              {bulkProcessing ? "Đang di chuyển..." : "Di chuyển"}
            </button>
          </>
        }
      >
        <p>
          Chọn thư mục đích cho <strong>{selectedFiles.length}</strong> file:
        </p>

        <FolderPicker
          value={bulkDestinationFolderId}
          onChange={setBulkDestinationFolderId}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteFile)}
        title="Xóa file"
        message={`Bạn có chắc muốn xóa "${deleteFile?.name || ""}"? File sẽ được chuyển vào thùng rác.`}
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

      <ConfirmDialog
        isOpen={bulkDelete}
        title="Xóa các file đã chọn"
        message={`Bạn có chắc muốn xóa ${selectedFiles.length} file đã chọn?`}
        confirmText="Xóa"
        cancelText="Hủy"
        danger
        loading={bulkDeleting}
        onConfirm={handleBulkDelete}
        onCancel={() => {
          if (!bulkDeleting) {
            setBulkDelete(false);
          }
        }}
      />

      <Modal
        isOpen={Boolean(renameFile)}
        title={`Đổi tên "${renameFile?.name || "file"}"`}
        onClose={() => {
          if (!renaming) {
            setRenameFile(null);
            setRenameValue("");
          }
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setRenameFile(null);
                setRenameValue("");
              }}
              disabled={renaming}
            >
              Hủy
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRename}
              disabled={renaming}
            >
              {renaming ? "Đang lưu..." : "Lưu"}
            </button>
          </>
        }
      >
        <FormInput
          label="Tên file"
          name="fileName"
          value={renameValue}
          onChange={(event) => setRenameValue(event.target.value)}
          disabled={renaming}
          required
        />
      </Modal>

      {contextMenu && (
        <div
          className="file-context-menu"
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              openRename(contextMenu.file);
              setContextMenu(null);
            }}
          >
            ✏️ Đổi tên
          </button>

          <button
            type="button"
            onClick={() => {
              setMoveFile(contextMenu.file);
              setContextMenu(null);
            }}
          >
            📂 Di chuyển
          </button>

          <button
            type="button"
            onClick={() => {
              setCopyFile(contextMenu.file);
              setContextMenu(null);
            }}
          >
            📋 Sao chép
          </button>

          <button
            type="button"
            onClick={() => {
              setPermissionFile(contextMenu.file);
              setContextMenu(null);
            }}
          >
            🔐 Quyền
          </button>

          <button
            type="button"
            onClick={() => {
              setShareFile(contextMenu.file);
              setContextMenu(null);
            }}
          >
            🔗 Chia sẻ
          </button>

          <button
            type="button"
            className="file-context-menu__danger"
            onClick={() => {
              setDeleteFile(contextMenu.file);
              setContextMenu(null);
            }}
          >
            🗑️ Xóa
          </button>
        </div>
      )}
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
      // Không phải JSON.
    }
  }
  return error?.message || "Không thể download file.";
}
