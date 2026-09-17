import { useEffect, useMemo, useState } from "react";

import Loading from "../../components/Loading/Loading";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";

import fileService from "../../services/fileService";
import folderService from "../../services/folderService";

import "./Trash.css";

const RETENTION_DAYS = 30;
const PAGE_SIZE = 8;

export default function Trash() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortColumn, setSortColumn] = useState("deletedAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedFile, setSelectedFile] = useState(null);
  const [restoreModal, setRestoreModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [restoreFolderModal, setRestoreFolderModal] = useState(false);
  const [selectedDeleteFile, setSelectedDeleteFile] = useState(null);
  const [permanentDeleteModal, setPermanentDeleteModal] = useState(false);
  const [selectedDeleteFolder, setSelectedDeleteFolder] = useState(null);
  const [permanentDeleteFolderModal, setPermanentDeleteFolderModal] =
    useState(false);
  const [deleteAllModal, setDeleteAllModal] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bulkRestoreModal, setBulkRestoreModal] = useState(false);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

  // =========================
  // Load trash
  // =========================
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
      setSelectedIds(new Set());
      setPage(1);
    } catch (err) {
      setError(err?.message || "Không thể tải Thùng rác.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

  // =========================
  // Combine files + folders
  // =========================
  const trashItems = useMemo(() => {
    return [
      ...folders.map((folder) => ({
        ...folder,
        _trashType: "folder",
        _trashId: `folder-${folder._id}`,
        _deletedAt: folder.deletedAt || null,
      })),

      ...files.map((file) => ({
        ...file,
        _trashType: "file",
        _trashId: `file-${file._id}`,
        _deletedAt: file.deletedAt || null,
      })),
    ];
  }, [files, folders]);

  // =========================
  // Sort
  // =========================
  const sortedItems = useMemo(() => {
    const result = [...trashItems];
    const getValue = (item) => {
      switch (sortColumn) {
        case "name":
          return String(item.name || "").toLowerCase();
        case "type":
          return item._trashType === "folder"
            ? "thư mục"
            : getFriendlyExtension(item.name, item.mimeType).toLowerCase();
        case "size":
          return item._trashType === "folder" ? -1 : Number(item.size || 0);
        case "deletedAt":
          return new Date(item._deletedAt || 0).getTime();
        case "remaining":
          return getRemainingDays(item._deletedAt);
        default:
          return 0;
      }
    };

    result.sort((a, b) => {
      const valueA = getValue(a);
      const valueB = getValue(b);

      let comparison = 0;

      if (typeof valueA === "number" && typeof valueB === "number") {
        comparison = valueA - valueB;
      } else {
        comparison = String(valueA).localeCompare(String(valueB), "vi", {
          numeric: true,
          sensitivity: "base",
        });
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [trashItems, sortColumn, sortDirection]);

  // =========================
  // Pagination
  // =========================
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  const visibleItems = sortedItems.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const firstItem = sortedItems.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, sortedItems.length);

  // =========================
  // Sort handler
  // =========================
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection(column === "deletedAt" ? "desc" : "asc");
    }
    setPage(1);
  };

  // =========================
  // Checkbox
  // =========================
  const visibleIds = visibleItems.map((item) => item._trashId);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const toggleSelect = (id) => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // =========================
  // Restore file
  // =========================
  const openRestoreModal = (file) => {
    setSelectedFile(file);
    setRestoreModal(true);
  };

  const handleRestore = async () => {
    if (!selectedFile?._id) {
      return;
    }

    try {
      setRestoring(true);
      setError("");

      await fileService.restoreFile(selectedFile._id);

      setFiles((current) =>
        current.filter((file) => file._id !== selectedFile._id),
      );
      setRestoreModal(false);
      setSelectedFile(null);
    } catch (err) {
      setError(err?.message || "Không thể khôi phục file.");
    } finally {
      setRestoring(false);
    }
  };

  // =========================
  // Restore folder
  // =========================
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

      setFolders((current) =>
        current.filter((folder) => folder._id !== selectedFolder._id),
      );
      setRestoreFolderModal(false);
      setSelectedFolder(null);
    } catch (err) {
      setError(err?.message || "Không thể khôi phục thư mục.");
    } finally {
      setRestoring(false);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) {
      return;
    }

    try {
      setRestoring(true);
      setError("");

      const selectedItems = trashItems.filter((item) =>
        selectedIds.has(item._trashId),
      );
      const selectedFiles = selectedItems.filter(
        (item) => item._trashType === "file",
      );
      const selectedFolders = selectedItems.filter(
        (item) => item._trashType === "folder",
      );
      await Promise.all([
        ...selectedFiles.map((file) => fileService.restoreFile(file._id)),
        ...selectedFolders.map((folder) =>
          folderService.restoreFolder(folder._id),
        ),
      ]);
      const selectedFileIds = new Set(selectedFiles.map((file) => file._id));
      const selectedFolderIds = new Set(
        selectedFolders.map((folder) => folder._id),
      );

      setFiles((current) =>
        current.filter((file) => !selectedFileIds.has(file._id)),
      );
      setFolders((current) =>
        current.filter((folder) => !selectedFolderIds.has(folder._id)),
      );
      setSelectedIds(new Set());
      setBulkRestoreModal(false);
      setPage(1);
    } catch (err) {
      setError(err?.message || "Không thể khôi phục các mục đã chọn.");
    } finally {
      setRestoring(false);
    }
  };

  // =========================
  // Permanent delete file
  // =========================
  const openPermanentDeleteModal = (file) => {
    setSelectedDeleteFile(file);
    setPermanentDeleteModal(true);
  };

  const handlePermanentDelete = async () => {
    if (!selectedDeleteFile?._id) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await fileService.permanentDelete(selectedDeleteFile._id);

      setFiles((current) =>
        current.filter((file) => file._id !== selectedDeleteFile._id),
      );
      setPermanentDeleteModal(false);
      setSelectedDeleteFile(null);
    } catch (err) {
      setError(err?.message || "Không thể xóa vĩnh viễn file.");
    } finally {
      setDeleting(false);
    }
  };

  // =========================
  // Permanent delete folder
  // =========================
  const openPermanentDeleteFolderModal = (folder) => {
    setSelectedDeleteFolder(folder);
    setPermanentDeleteFolderModal(true);
  };

  const handlePermanentDeleteFolder = async () => {
    if (!selectedDeleteFolder?._id) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await folderService.permanentDelete(selectedDeleteFolder._id);

      setFolders((current) =>
        current.filter((folder) => folder._id !== selectedDeleteFolder._id),
      );
      setPermanentDeleteFolderModal(false);
      setSelectedDeleteFolder(null);
    } catch (err) {
      setError(err?.message || "Không thể xóa vĩnh viễn thư mục.");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedIds.size === 0) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const selectedItems = trashItems.filter((item) =>
        selectedIds.has(item._trashId),
      );
      const selectedFiles = selectedItems.filter(
        (item) => item._trashType === "file",
      );
      const selectedFolders = selectedItems.filter(
        (item) => item._trashType === "folder",
      );

      await Promise.all([
        ...selectedFiles.map((file) => fileService.permanentDelete(file._id)),
        ...selectedFolders.map((folder) =>
          folderService.permanentDelete(folder._id),
        ),
      ]);

      const selectedFileIds = new Set(selectedFiles.map((file) => file._id));
      const selectedFolderIds = new Set(
        selectedFolders.map((folder) => folder._id),
      );

      setFiles((current) =>
        current.filter((file) => !selectedFileIds.has(file._id)),
      );
      setFolders((current) =>
        current.filter((folder) => !selectedFolderIds.has(folder._id)),
      );
      setSelectedIds(new Set());
      setBulkDeleteModal(false);
      setPage(1);
    } catch (err) {
      setError(err?.message || "Không thể xóa vĩnh viễn các mục đã chọn.");
    } finally {
      setDeleting(false);
    }
  };

  // =========================
  // Delete all
  // =========================

  const handleDeleteAll = async () => {
    if (trashItems.length === 0) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await Promise.all([
        ...files.map((file) => fileService.permanentDelete(file._id)),
        ...folders.map((folder) => folderService.permanentDelete(folder._id)),
      ]);

      setFiles([]);
      setFolders([]);
      setSelectedIds(new Set());
      setDeleteAllModal(false);
      setPage(1);
    } catch (err) {
      setError(err?.message || "Không thể xóa toàn bộ Thùng rác.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loading message="Đang tải Thùng rác..." />;
  }

  return (
    <div className="trash-page">
      {/* =========================
          Confirm dialogs
          ========================= */}
      <ConfirmDialog
        isOpen={restoreModal}
        title="Khôi phục file"
        message={`Bạn có chắc muốn khôi phục file "${selectedFile?.name || ""}"?`}
        confirmText="Khôi phục"
        cancelText="Hủy"
        loading={restoring}
        onConfirm={handleRestore}
        onCancel={() => {
          if (!restoring) {
            setRestoreModal(false);
            setSelectedFile(null);
          }
        }}
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

      <ConfirmDialog
        isOpen={bulkRestoreModal}
        title="Khôi phục các mục đã chọn"
        message={`Bạn có chắc muốn khôi phục ${selectedIds.size} mục đã chọn?`}
        confirmText="Khôi phục"
        cancelText="Hủy"
        loading={restoring}
        onConfirm={handleBulkRestore}
        onCancel={() => {
          if (!restoring) {
            setBulkRestoreModal(false);
          }
        }}
      />

      <ConfirmDialog
        isOpen={permanentDeleteModal}
        title="Xóa vĩnh viễn file"
        message={`Bạn có chắc muốn xóa vĩnh viễn file "${selectedDeleteFile?.name || ""}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy"
        loading={deleting}
        onConfirm={handlePermanentDelete}
        onCancel={() => {
          if (!deleting) {
            setPermanentDeleteModal(false);
            setSelectedDeleteFile(null);
          }
        }}
      />

      <ConfirmDialog
        isOpen={permanentDeleteFolderModal}
        title="Xóa vĩnh viễn thư mục"
        message={`Bạn có chắc muốn xóa vĩnh viễn thư mục "${selectedDeleteFolder?.name || ""}" và toàn bộ dữ liệu bên trong? Hành động này không thể hoàn tác.`}
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy"
        loading={deleting}
        onConfirm={handlePermanentDeleteFolder}
        onCancel={() => {
          if (!deleting) {
            setPermanentDeleteFolderModal(false);
            setSelectedDeleteFolder(null);
          }
        }}
      />

      <ConfirmDialog
        isOpen={bulkDeleteModal}
        title="Xóa vĩnh viễn các mục đã chọn"
        message={`Bạn có chắc muốn xóa vĩnh viễn ${selectedIds.size} mục đã chọn? Hành động này không thể hoàn tác.`}
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy"
        loading={deleting}
        onConfirm={handleBulkPermanentDelete}
        onCancel={() => {
          if (!deleting) {
            setBulkDeleteModal(false);
          }
        }}
      />

      <ConfirmDialog
        isOpen={deleteAllModal}
        title="Xóa tất cả"
        message="Bạn có chắc muốn xóa vĩnh viễn toàn bộ file và thư mục trong Thùng rác? Hành động này không thể hoàn tác."
        confirmText="Xóa tất cả"
        cancelText="Hủy"
        loading={deleting}
        onConfirm={handleDeleteAll}
        onCancel={() => {
          if (!deleting) {
            setDeleteAllModal(false);
          }
        }}
      />

      {/* =========================
          Header
          ========================= */}
      <div className="trash-page__header">
        <div>
          <h1>Thùng rác</h1>

          <p>
            Các file và thư mục đã bị xóa. Bạn có thể khôi phục hoặc xóa vĩnh
            viễn.
          </p>
        </div>

        <button
          type="button"
          className="trash-delete-all"
          disabled={trashItems.length === 0}
          onClick={() => setDeleteAllModal(true)}
        >
          <TrashIcon />
          <span>Xóa tất cả</span>
        </button>
      </div>

      {error && <div className="trash-error">{error}</div>}

      {selectedIds.size > 0 && (
        <div className="trash-selection-toolbar">
          <div className="trash-selection-toolbar__info">
            <strong>{selectedIds.size}</strong>
            <span>mục đã chọn</span>
          </div>

          <div className="trash-selection-toolbar__actions">
            <button
              type="button"
              className="trash-selection-toolbar__clear"
              onClick={() => setSelectedIds(new Set())}
            >
              Bỏ chọn
            </button>

            <button
              type="button"
              className="trash-selection-toolbar__restore"
              onClick={() => setBulkRestoreModal(true)}
            >
              <RestoreIcon />
              <span>Khôi phục</span>
            </button>

            <button
              type="button"
              className="trash-selection-toolbar__delete"
              onClick={() => setBulkDeleteModal(true)}
            >
              <TrashIcon />
              <span>Xóa vĩnh viễn</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================
          Table
          ========================= */}
      <div className="trash-card">
        <div className="trash-table">
          {/* Header */}

          <div className="trash-table__head">
            <div className="trash-col trash-col--check">
              <label className="trash-checkbox" title="Chọn tất cả">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  aria-label="Chọn tất cả"
                />
                <span />
              </label>
            </div>

            <SortableHeader
              label="Tên"
              column="name"
              activeColumn={sortColumn}
              direction={sortDirection}
              onSort={handleSort}
            />

            <SortableHeader
              label="Loại"
              column="type"
              activeColumn={sortColumn}
              direction={sortDirection}
              onSort={handleSort}
            />

            <SortableHeader
              label="Dung lượng"
              column="size"
              activeColumn={sortColumn}
              direction={sortDirection}
              onSort={handleSort}
            />

            <SortableHeader
              label="Ngày xóa"
              column="deletedAt"
              activeColumn={sortColumn}
              direction={sortDirection}
              onSort={handleSort}
            />

            <SortableHeader
              label="Thời gian còn lại"
              column="remaining"
              activeColumn={sortColumn}
              direction={sortDirection}
              onSort={handleSort}
            />

            <div className="trash-col trash-col--actions">Thao tác</div>
          </div>

          {/* Rows */}
          {visibleItems.length === 0 ? (
            <div className="trash-empty">
              <TrashIcon />

              <h2>Thùng rác trống</h2>

              <p>Không có file hoặc thư mục nào đã bị xóa.</p>
            </div>
          ) : (
            visibleItems.map((item) =>
              item._trashType === "folder" ? (
                <TrashFolderItem
                  key={item._trashId}
                  folder={item}
                  selected={selectedIds.has(item._trashId)}
                  onSelect={() => toggleSelect(item._trashId)}
                  onRestore={openRestoreFolderModal}
                  onPermanentDelete={openPermanentDeleteFolderModal}
                />
              ) : (
                <TrashItem
                  key={item._trashId}
                  file={item}
                  selected={selectedIds.has(item._trashId)}
                  onSelect={() => toggleSelect(item._trashId)}
                  onRestore={openRestoreModal}
                  onPermanentDelete={openPermanentDeleteModal}
                />
              ),
            )
          )}

          {/* Footer */}
          <div className="trash-footer">
            <span>
              Hiển thị {firstItem} - {lastItem} của {sortedItems.length} mục
            </span>

            <div className="trash-pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                aria-label="Trang trước"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (number) => (
                  <button
                    type="button"
                    key={number}
                    className={number === page ? "is-active" : ""}
                    onClick={() => setPage(number)}
                  >
                    {number}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                aria-label="Trang sau"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          Retention information
          ========================= */}
      <div className="trash-retention">
        <div className="trash-retention__icon">
          <TrashIcon />
        </div>

        <div>
          <h3>Tự động xóa vĩnh viễn</h3>

          <p>
            Các file trong thùng rác sẽ được tự động xóa vĩnh viễn sau 30 ngày.
          </p>

          <p>Hãy khôi phục các file quan trọng trước khi quá hạn.</p>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Sortable header
// =====================================================
function SortableHeader({ label, column, activeColumn, direction, onSort }) {
  const isActive = activeColumn === column;

  return (
    <div className="trash-col">
      <button
        type="button"
        className="trash-sort-button"
        onClick={() => onSort(column)}
      >
        <span>{label}</span>

        <span className={`trash-sort-icon ${isActive ? "is-active" : ""}`}>
          {isActive ? (direction === "asc" ? "⌃" : "⌄") : "↕"}
        </span>
      </button>
    </div>
  );
}

// =====================================================
// File row
// =====================================================
function TrashItem({ file, selected, onSelect, onRestore, onPermanentDelete }) {
  const extension = getFriendlyExtension(file.name, file.mimeType);
  const remaining = getRemainingDays(file.deletedAt);

  return (
    <div className="trash-row">
      <div className="trash-col trash-col--check">
        <label className="trash-checkbox">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            aria-label={`Chọn ${file.name || "file"}`}
          />
          <span />
        </label>
      </div>

      <div className="trash-col trash-col--name">
        <FileTypeIcon name={file.name} mimeType={file.mimeType} />

        <div className="trash-name-info">
          <strong title={file.name}>{file.name || "Không có tên"}</strong>
        </div>
      </div>

      <div className="trash-col trash-col--type">{extension || "FILE"}</div>

      <div className="trash-col trash-col--size">
        {formatStorage(file.size)}
      </div>

      <div className="trash-col trash-col--date">
        {formatDate(file.deletedAt)}
      </div>

      <div className="trash-col trash-col--remaining">
        <RemainingBadge days={remaining} />
      </div>

      <div className="trash-col trash-col--actions">
        <button
          type="button"
          className="trash-action trash-action--restore"
          onClick={() => onRestore(file)}
          title="Khôi phục"
          aria-label="Khôi phục"
        >
          <RestoreIcon />
        </button>

        <button
          type="button"
          className="trash-action trash-action--delete"
          onClick={() => onPermanentDelete(file)}
          title="Xóa vĩnh viễn"
          aria-label="Xóa vĩnh viễn"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

// =====================================================
// Folder row
// =====================================================
function TrashFolderItem({
  folder,
  selected,
  onSelect,
  onRestore,
  onPermanentDelete,
}) {
  const deletedAt = folder.deletedAt || null;
  const remaining = getRemainingDays(deletedAt);

  return (
    <div className="trash-row">
      <div className="trash-col trash-col--check">
        <label className="trash-checkbox">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            aria-label={`Chọn ${folder.name || "thư mục"}`}
          />
          <span />
        </label>
      </div>

      <div className="trash-col trash-col--name">
        <FolderIcon />

        <div className="trash-name-info">
          <strong title={folder.name}>{folder.name || "Không có tên"}</strong>
        </div>
      </div>

      <div className="trash-col trash-col--type">Thư mục</div>

      <div className="trash-col trash-col--size">-</div>

      <div className="trash-col trash-col--date">{formatDate(deletedAt)}</div>

      <div className="trash-col trash-col--remaining">
        <RemainingBadge days={remaining} />
      </div>

      <div className="trash-col trash-col--actions">
        <button
          type="button"
          className="trash-action trash-action--restore"
          onClick={() => onRestore(folder)}
          title="Khôi phục"
          aria-label="Khôi phục"
        >
          <RestoreIcon />
        </button>

        <button
          type="button"
          className="trash-action trash-action--delete"
          onClick={() => onPermanentDelete(folder)}
          title="Xóa vĩnh viễn"
          aria-label="Xóa vĩnh viễn"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

// =====================================================
// Remaining badge
// =====================================================
function RemainingBadge({ days }) {
  if (days <= 0) {
    return (
      <span className="trash-remaining trash-remaining--danger">Quá hạn</span>
    );
  }

  return (
    <span
      className={`trash-remaining ${
        days <= 7 ? "trash-remaining--warning" : "trash-remaining--normal"
      }`}
    >
      Còn {days} ngày
    </span>
  );
}

// =====================================================
// File type
// =====================================================
function getFriendlyExtension(name = "", mimeType = "") {
  const mime = String(mimeType || "").toLowerCase();
  const extension = getExtension(name);

  if (mime === "application/pdf" || extension === "pdf") {
    return "PDF";
  }
  if (mime.includes("word") || extension === "doc" || extension === "docx") {
    return extension === "doc" ? "DOC" : "DOCX";
  }
  if (
    mime.includes("excel") ||
    mime.includes("spreadsheet") ||
    extension === "xls" ||
    extension === "xlsx" ||
    extension === "csv"
  ) {
    if (extension === "csv") {
      return "CSV";
    }
    return extension === "xls" ? "XLS" : "XLSX";
  }
  if (
    mime.includes("powerpoint") ||
    mime.includes("presentation") ||
    extension === "ppt" ||
    extension === "pptx"
  ) {
    return extension === "ppt" ? "PPT" : "PPTX";
  }
  if (
    mime.includes("zip") ||
    mime.includes("rar") ||
    mime.includes("7z") ||
    ["zip", "rar", "7z"].includes(extension)
  ) {
    return extension.toUpperCase();
  }
  if (mime.startsWith("image/")) {
    const imageType = mime.split("/")[1];

    return imageType === "jpeg" ? "JPG" : imageType.toUpperCase();
  }
  if (extension) {
    return extension.toUpperCase();
  }
  return "";
}

function getExtension(name = "") {
  const value = String(name || "").trim();
  const dot = value.lastIndexOf(".");

  if (dot <= 0 || dot === value.length - 1) {
    return "";
  }
  return value.slice(dot + 1).toLowerCase();
}

// =====================================================
// Helpers
// =====================================================
function formatStorage(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) {
    return "-";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  return `${(value / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

function formatDate(date) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRemainingDays(date) {
  if (!date) {
    return RETENTION_DAYS;
  }

  const deletedAt = new Date(date).getTime();
  if (!Number.isFinite(deletedAt)) {
    return RETENTION_DAYS;
  }
  const elapsed = Math.floor((Date.now() - deletedAt) / (24 * 60 * 60 * 1000));
  return Math.max(0, RETENTION_DAYS - elapsed);
}

// =====================================================
// Icons
// =====================================================
function FileTypeIcon({ name, mimeType }) {
  const type = getFriendlyExtension(name, mimeType);
  const classNameMap = {
    PDF: "trash-file-icon--pdf",
    PNG: "trash-file-icon--image",
    JPG: "trash-file-icon--image",
    JPEG: "trash-file-icon--image",
    GIF: "trash-file-icon--image",
    WEBP: "trash-file-icon--image",
    DOC: "trash-file-icon--word",
    DOCX: "trash-file-icon--word",
    XLS: "trash-file-icon--excel",
    XLSX: "trash-file-icon--excel",
    CSV: "trash-file-icon--excel",
    PPT: "trash-file-icon--powerpoint",
    PPTX: "trash-file-icon--powerpoint",
    ZIP: "trash-file-icon--archive",
    RAR: "trash-file-icon--archive",
    "7Z": "trash-file-icon--archive",
  };

  const className = classNameMap[type] || "trash-file-icon--file";
  return <div className={`trash-file-icon ${className}`}>{type || "FILE"}</div>;
}

function FolderIcon() {
  return (
    <div className="trash-folder-icon" aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <path
          d="M5 13.5C5 10.46 7.46 8 10.5 8H19l5 5h13.5C40.54 13 43 15.46 43 18.5v16C43 37.54 40.54 40 37.5 40h-27C7.46 40 5 37.54 5 34.5v-21Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      className="trash-svg-icon"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 12H39"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <path
        d="M17 12V7H31V12"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M13 12L15.5 41H32.5L35 12"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M21 19V34"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <path
        d="M27 19V34"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg
      className="trash-svg-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 10a8 8 0 1 1 2.34 5.66M4 10V5m0 5h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
