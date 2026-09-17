import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import FileUpload from "../../components/FileUpload/FileUpload";
import Breadcrumb from "../../components/Breadcrumb/Breadcrumb";
import Loading from "../../components/Loading/Loading";
import Modal from "../../components/Modal/Modal";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import FormInput from "../../components/FormInput/FormInput";
import ShareDialog from "../../components/ShareDialog/ShareDialog";
import FolderTree from "../../components/FolderTree/FolderTree";
import FolderItem from "../../components/FolderItem/FolderItem";
import FolderMoveDialog from "../../components/FolderMoveDialog/FolderMoveDialog";
import FolderCopyDialog from "../../components/FolderCopyDialog/FolderCopyDialog";

import folderService from "../../services/folderService";
import fileService from "../../services/fileService";
import userService from "../../services/userService";

import FileList from "./FileList";

import "./Files.css";

export default function Files() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentFolderId = searchParams.get("folder");
  const previewFileId = searchParams.get("preview");
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [createModal, setCreateModal] = useState(false);
  const [renameModal, setRenameModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [moveModal, setMoveModal] = useState(false);
  const [copyModal, setCopyModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderName, setFolderName] = useState("");
  const [saving, setSaving] = useState(false);
  const [shareFolder, setShareFolder] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [breadcrumbItems, setBreadcrumbItems] = useState([]);
  const [dragError, setDragError] = useState("");
  const [storage, setStorage] = useState({
    storageUsed: 0,
    storageLimit: 0,
    storageRemaining: 0,
    usagePercent: 0,
  });
  const [storageLoading, setStorageLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [selectAllRequest, setSelectAllRequest] = useState({
    checked: false,
    version: 0,
  });
  const [allFilesSelected, setAllFilesSelected] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [selectedFolderIds, setSelectedFolderIds] = useState([]);
  const [rangeSelecting, setRangeSelecting] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [externalDragging, setExternalDragging] = useState(false);
  const [bulkMoveModal, setBulkMoveModal] = useState(false);
  const [bulkCopyModal, setBulkCopyModal] = useState(false);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [bulkDestinationFolderId, setBulkDestinationFolderId] = useState(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    const handleDragOver = (event) => {
      if (event.dataTransfer?.types?.includes("Files")) {
        event.preventDefault();
        setExternalDragging(true);
      }
    };

    const handleDragLeave = () => {
      setExternalDragging(false);
    };
    const handleDrop = (event) => {
      if (!event.dataTransfer?.files?.length) {
        return;
      }
      event.preventDefault();
      setExternalDragging(false);
      window.dispatchEvent(
        new CustomEvent("file-manager-external-upload", {
          detail: {
            files: Array.from(event.dataTransfer.files),
          },
        }),
      );
    };
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  useEffect(() => {
    const handleStart = (event) => {
      if (event.detail?.type !== "folder") {
        return;
      }
      setRangeSelecting(true);
      setSelectedFolderIds([event.detail.id]);
    };
    const handleEnter = (event) => {
      if (!rangeSelecting || event.detail?.type !== "folder") {
        return;
      }
      setSelectedFolderIds((prev) =>
        prev.includes(event.detail.id) ? prev : [...prev, event.detail.id],
      );
    };
    const handleStop = () => {
      setRangeSelecting(false);
    };

    window.addEventListener("file-manager-range-start", handleStart);
    window.addEventListener("file-manager-range-enter", handleEnter);
    window.addEventListener("pointerup", handleStop);
    return () => {
      window.removeEventListener("file-manager-range-start", handleStart);
      window.removeEventListener("file-manager-range-enter", handleEnter);
      window.removeEventListener("pointerup", handleStop);
    };
  }, [rangeSelecting]);

  function handleSort(key) {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function sortFolders(items) {
    return [...items].sort((a, b) => {
      let aValue;
      let bValue;

      switch (sortConfig.key) {
        case "size":
          aValue = Number(a.size || 0);
          bValue = Number(b.size || 0);
          break;
        case "updatedAt":
          aValue = new Date(a.updatedAt || a.createdAt || 0).getTime();
          bValue = new Date(b.updatedAt || b.createdAt || 0).getTime();
          break;
        default:
          aValue = String(a.name || "").toLowerCase();
          bValue = String(b.name || "").toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }

  useEffect(() => {
    loadFolders();
    loadBreadcrumb();
    loadStorage();
  }, [currentFolderId]);

  useEffect(() => {
    function handleDocumentClick() {
      setContextMenu(null);
    }

    function handleOtherContextMenu() {
      setContextMenu(null);
    }

    document.addEventListener("click", handleDocumentClick);
    window.addEventListener(
      "file-manager-context-menu-open",
      handleOtherContextMenu,
    );

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      window.removeEventListener(
        "file-manager-context-menu-open",
        handleOtherContextMenu,
      );
    };
  }, []);

  async function loadStorage() {
    try {
      setStorageLoading(true);

      const response = await userService.getStorageQuota();

      setStorage({
        storageUsed: Number(response?.storageUsed || 0),
        storageLimit: Number(response?.storageLimit || 0),
        storageRemaining: Number(response?.storageRemaining || 0),
        usagePercent: Number(response?.usagePercent || 0),
      });
    } catch (err) {
      console.error("Không thể tải dung lượng lưu trữ:", err);
      setStorage({
        storageUsed: 0,
        storageLimit: 0,
        storageRemaining: 0,
        usagePercent: 0,
      });
    } finally {
      setStorageLoading(false);
    }
  }

  async function loadBreadcrumb() {
    if (!currentFolderId) {
      setBreadcrumbItems([]);
      return;
    }

    try {
      const items = [];
      let folderId = currentFolderId;
      const visited = new Set();
      while (folderId) {
        if (visited.has(String(folderId))) {
          break;
        }
        visited.add(String(folderId));

        const folder = await folderService.getFolder(folderId);
        if (!folder) {
          break;
        }

        items.unshift({
          id: folder._id,
          name: folder.name,
          path: `/files?folder=${folder._id}`,
        });
        folderId = folder.parentFolder || null;
      }
      setBreadcrumbItems(items);
    } catch (err) {
      setBreadcrumbItems([]);
    }
  }

  async function loadFolders() {
    try {
      setLoading(true);
      setError("");

      const response = await folderService.getFolders(currentFolderId);
      const data = response?.data || response || [];

      setFolders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách thư mục.");
    } finally {
      setLoading(false);
    }
  }

  function refreshFolders() {
    loadFolders();
    loadStorage();
    setRefreshKey((value) => value + 1);
  }

  function handleOpenFolder(folder) {
    navigate(`/files?folder=${folder._id}`);
  }

  function handleSelectFolder(folder) {
    handleOpenFolder(folder);
  }

  function validateFolderName(value) {
    const name = value.trim();
    if (!name) {
      return "Tên thư mục không được để trống.";
    }
    if (name.length > 255) {
      return "Tên thư mục không được vượt quá 255 ký tự.";
    }
    if (/[\\/:*?"<>|]/.test(name)) {
      return 'Tên thư mục không được chứa các ký tự: \\ / : * ? " < > |';
    }
    return "";
  }

  async function handleCreateFolder() {
    const validationError = validateFolderName(folderName);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      await folderService.createFolder({
        name: folderName.trim(),
        parentFolder: currentFolderId || null,
      });

      setFolderName("");
      setCreateModal(false);
      refreshFolders();
    } catch (err) {
      setError(err?.message || "Không thể tạo thư mục.");
    } finally {
      setSaving(false);
    }
  }

  function openRenameModal(folder) {
    setSelectedFolder(folder);
    setFolderName(folder.name || "");
    setError("");
    setRenameModal(true);
  }

  async function handleRenameFolder() {
    if (!selectedFolder) {
      return;
    }

    const validationError = validateFolderName(folderName);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      await folderService.renameFolder(selectedFolder._id, folderName.trim());

      setRenameModal(false);
      setSelectedFolder(null);
      setFolderName("");

      refreshFolders();
    } catch (err) {
      setError(err?.message || "Không thể đổi tên thư mục.");
    } finally {
      setSaving(false);
    }
  }

  function openMoveModal(folder) {
    setSelectedFolder(folder);
    setError("");
    setMoveModal(true);
  }

  function openCopyModal(folder) {
    setSelectedFolder(folder);
    setError("");
    setCopyModal(true);
  }

  function openDeleteModal(folder) {
    setSelectedFolder(folder);
    setError("");
    setDeleteModal(true);
  }

  async function handleDeleteFolder() {
    if (!selectedFolder) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await folderService.deleteFolder(selectedFolder._id);

      setDeleteModal(false);
      setSelectedFolder(null);

      refreshFolders();
    } catch (err) {
      setError(err?.message || "Không thể xóa thư mục.");
    } finally {
      setSaving(false);
    }
  }

  function openContextMenu(event, folder) {
    event.preventDefault();
    event.stopPropagation();

    window.dispatchEvent(new CustomEvent("file-manager-context-menu-open"));

    setContextMenu({
      folder,
      x: event.clientX,
      y: event.clientY,
    });
  }

  async function handleDropFile(fileId, destinationFolder) {
    if (!fileId || !destinationFolder?._id) {
      return;
    }

    try {
      setDragError("");

      await fileService.moveFile(fileId, destinationFolder._id);

      refreshFolders();
    } catch (err) {
      setDragError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể di chuyển file.",
      );
    }
  }

  async function handleDropFolder(folderId, destinationFolder) {
    if (!folderId || !destinationFolder?._id) {
      return;
    }
    if (String(folderId) === String(destinationFolder._id)) {
      setDragError("Không thể di chuyển thư mục vào chính nó.");
      return;
    }

    try {
      setDragError("");
      await folderService.moveFolder(folderId, destinationFolder._id);
      refreshFolders();
    } catch (err) {
      setDragError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể di chuyển thư mục.",
      );
    }
  }

  async function handleBulkMove() {
    if (selectedFileIds.length === 0 && selectedFolderIds.length === 0) {
      return;
    }

    try {
      setBulkProcessing(true);
      setError("");
      for (const folderId of selectedFolderIds) {
        if (
          bulkDestinationFolderId &&
          String(folderId) === String(bulkDestinationFolderId)
        ) {
          throw new Error("Không thể di chuyển thư mục vào chính nó.");
        }
        await folderService.moveFolder(folderId, bulkDestinationFolderId);
      }
      for (const fileId of selectedFileIds) {
        await fileService.moveFile(fileId, bulkDestinationFolderId);
      }

      setSelectedFileIds([]);
      setSelectedFolderIds([]);
      setBulkDestinationFolderId(null);
      setBulkMoveModal(false);
      refreshFolders();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể di chuyển các mục đã chọn.",
      );
    } finally {
      setBulkProcessing(false);
    }
  }

  async function handleBulkCopy() {
    if (selectedFileIds.length === 0 && selectedFolderIds.length === 0) {
      return;
    }

    try {
      setBulkProcessing(true);
      setError("");
      for (const folderId of selectedFolderIds) {
        await folderService.copyFolder(folderId, bulkDestinationFolderId);
      }
      for (const fileId of selectedFileIds) {
        await fileService.copyFile(fileId, bulkDestinationFolderId);
      }

      setSelectedFileIds([]);
      setSelectedFolderIds([]);
      setBulkDestinationFolderId(null);
      setBulkCopyModal(false);

      refreshFolders();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể sao chép các mục đã chọn.",
      );
    } finally {
      setBulkProcessing(false);
    }
  }

  async function handleBulkDeleteAll() {
    if (selectedFileIds.length === 0 && selectedFolderIds.length === 0) {
      return;
    }

    try {
      setBulkProcessing(true);
      setError("");
      for (const fileId of selectedFileIds) {
        await fileService.deleteFile(fileId);
      }
      for (const folderId of selectedFolderIds) {
        await folderService.deleteFolder(folderId);
      }

      setSelectedFileIds([]);
      setSelectedFolderIds([]);
      setBulkDeleteModal(false);
      refreshFolders();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể xóa các mục đã chọn.",
      );
    } finally {
      setBulkProcessing(false);
    }
  }

  return (
    <>
      <div
        className={`files-page ${
          externalDragging ? "files-page--external-dragging" : ""
        }`}
      >
        <div className="files-page__header">
          <div>
            <h1>Tệp của tôi</h1>

            <p className="files-page__subtitle">
              Quản lý file và thư mục của bạn
            </p>
          </div>

          <div className="files-page__toolbar">
            <button
              type="button"
              className="files-page__new-folder"
              onClick={() => {
                setError("");
                setFolderName("");
                setCreateModal(true);
              }}
            >
              <span className="files-page__button-icon">＋</span>
              <span>Thư mục mới</span>
            </button>

            <button
              type="button"
              className="files-page__upload"
              onClick={() => {
                document
                  .querySelector(".file-upload input[type='file']")
                  ?.click();
              }}
            >
              <span className="files-page__upload-icon">▤</span>

              <span>Tải lên</span>

              <span className="files-page__upload-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="m7 9 5 5 5-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {dragError && <div className="error-message">{dragError}</div>}

        <div className="folder-manager">
          <aside className="folder-manager__sidebar">
            <div className="folder-manager__title">Thư mục</div>

            <button
              type="button"
              className={`folder-manager__root ${
                !currentFolderId ? "folder-manager__root--selected" : ""
              }`}
              onClick={() => navigate("/files")}
            >
              <span className="folder-manager__root-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"
                    fill="currentColor"
                  />
                </svg>
              </span>

              <span>Tất cả tệp</span>
            </button>

            <FolderTree
              selectedFolderId={currentFolderId}
              onSelect={handleSelectFolder}
              refreshKey={refreshKey}
            />
          </aside>

          <section className="folder-manager__content">
            <div className="folder-manager__content-header">
              <h2>Tất cả tệp</h2>

              <div className="folder-manager__view-toggle">
                <button
                  type="button"
                  className={`folder-manager__view-button ${
                    viewMode === "list"
                      ? "folder-manager__view-button--active"
                      : ""
                  }`}
                  onClick={() => setViewMode("list")}
                  aria-label="Xem dạng danh sách"
                  title="Danh sách"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M4 6h3M10 6h10M4 12h3M10 12h10M4 18h3M10 18h10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  className={`folder-manager__view-button ${
                    viewMode === "grid"
                      ? "folder-manager__view-button--active"
                      : ""
                  }`}
                  onClick={() => setViewMode("grid")}
                  aria-label="Xem dạng lưới"
                  title="Lưới"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect
                      x="4"
                      y="4"
                      width="6"
                      height="6"
                      rx="1"
                      fill="currentColor"
                    />

                    <rect
                      x="14"
                      y="4"
                      width="6"
                      height="6"
                      rx="1"
                      fill="currentColor"
                    />

                    <rect
                      x="4"
                      y="14"
                      width="6"
                      height="6"
                      rx="1"
                      fill="currentColor"
                    />

                    <rect
                      x="14"
                      y="14"
                      width="6"
                      height="6"
                      rx="1"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div
              className={`files-unified-table files-unified-table--${viewMode}`}
            >
              <div className="files-unified-table__header">
                <div className="files-unified-table__checkbox">
                  <input
                    type="checkbox"
                    checked={allFilesSelected}
                    onChange={(event) => {
                      setAllFilesSelected(event.target.checked);
                      setSelectAllRequest({
                        checked: event.target.checked,
                        version: Date.now(),
                      });
                    }}
                    aria-label="Chọn tất cả tệp"
                  />
                </div>

                <button
                  type="button"
                  className="files-table-sort-button"
                  onClick={() => handleSort("name")}
                >
                  Tên
                  <span>
                    {sortConfig.key === "name"
                      ? sortConfig.direction === "asc"
                        ? "↑"
                        : "↓"
                      : "↕"}
                  </span>
                </button>

                <div>Loại</div>

                <button
                  type="button"
                  className="files-table-sort-button"
                  onClick={() => handleSort("size")}
                >
                  Dung lượng
                  <span>
                    {sortConfig.key === "size"
                      ? sortConfig.direction === "asc"
                        ? "↑"
                        : "↓"
                      : "↕"}
                  </span>
                </button>

                <button
                  type="button"
                  className="files-table-sort-button"
                  onClick={() => handleSort("updatedAt")}
                >
                  Cập nhật
                  <span>
                    {sortConfig.key === "updatedAt"
                      ? sortConfig.direction === "asc"
                        ? "↑"
                        : "↓"
                      : "↕"}
                  </span>
                </button>

                <div>Thao tác</div>
              </div>

              <div className="files-unified-table__folders">
                {loading ? (
                  <Loading message="Đang tải thư mục..." />
                ) : folders.length === 0 ? null : (
                  sortFolders(folders).map((folder) => (
                    <FolderItem
                      key={folder._id}
                      folder={folder}
                      onOpen={handleOpenFolder}
                      onDropFile={handleDropFile}
                      onRename={openRenameModal}
                      onMove={openMoveModal}
                      onCopy={openCopyModal}
                      onDelete={openDeleteModal}
                      onShare={(item) =>
                        setShareFolder({
                          ...item,
                          type: "folder",
                        })
                      }
                      onContextMenu={openContextMenu}
                      selected={selectedFolderIds.includes(folder._id)}
                      onSelect={(item, checked) => {
                        setSelectedFolderIds((prev) =>
                          checked
                            ? [...new Set([...prev, item._id])]
                            : prev.filter((id) => id !== item._id),
                        );
                      }}
                      onDropFolder={handleDropFolder}
                    />
                  ))
                )}
              </div>

              <div className="files-unified-table__files">
                <FileList
                  selectAllRequest={selectAllRequest}
                  onSelectionStateChange={setAllFilesSelected}
                  onSelectionChange={setSelectedFileIds}
                  sortConfig={sortConfig}
                  viewMode={viewMode}
                  onFilesChanged={refreshFolders}
                  openFileId={previewFileId}
                  showSelectionToolbar={false}
                />
              </div>
            </div>

            <div className="files-page__table-footer">
              <span>Hiển thị 1 - 10 của 10 tệp</span>

              <div className="files-page__pagination">
                <button
                  type="button"
                  className="files-page__pagination-button"
                  aria-label="Trang trước"
                  disabled
                >
                  ‹
                </button>

                <button
                  type="button"
                  className="files-page__pagination-button files-page__pagination-button--active"
                  aria-current="page"
                >
                  1
                </button>

                <button
                  type="button"
                  className="files-page__pagination-button"
                  aria-label="Trang sau"
                >
                  ›
                </button>
              </div>
            </div>

            {(selectedFileIds.length > 0 || selectedFolderIds.length > 0) && (
              <div className="files-page__selection-toolbar">
                <div className="files-page__selection-info">
                  Đã chọn{" "}
                  <strong>
                    {selectedFileIds.length + selectedFolderIds.length}
                  </strong>{" "}
                  mục
                </div>

                <div className="files-page__selection-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setBulkMoveModal(true)}
                  >
                    📂 Di chuyển
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setBulkCopyModal(true)}
                  >
                    📋 Sao chép
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setBulkDeleteModal(true)}
                  >
                    🗑 Xóa
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedFileIds([]);
                      setSelectedFolderIds([]);
                    }}
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* STORAGE NẰM NGOÀI folder-manager */}
        <div className="files-page__storage">
          <div className="files-page__storage-info">
            <div className="files-page__storage-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <path
                  d="M15 38h21a9 9 0 0 0 1-17.9A13 13 0 0 0 12.8 17 9 9 0 0 0 15 38Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <div>
              <h3 className="files-page__storage-title">Lưu trữ an toàn</h3>

              <p className="files-page__storage-description">
                Tất cả file của bạn đều được lưu trữ an toàn trên đám mây. Truy
                cập mọi lúc, mọi nơi.
              </p>
            </div>
          </div>

          <div className="files-page__storage-usage">
            <div className="files-page__storage-usage-header">
              <span>
                {storageLoading
                  ? "Đang tính dung lượng..."
                  : `Đã sử dụng ${formatStorageSize(
                      storage.storageUsed,
                    )} / ${formatStorageSize(storage.storageLimit)}`}
              </span>

              <span>
                {storageLoading ? "--" : `${Math.round(storage.usagePercent)}%`}
              </span>
            </div>

            <div className="files-page__storage-progress">
              <span
                style={{
                  width: `${Math.min(Math.max(storage.usagePercent, 0), 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <FileUpload folderId={currentFolderId} onUploaded={refreshFolders} />
      </div>

      <Modal
        isOpen={bulkMoveModal}
        title="Di chuyển các mục đã chọn"
        onClose={() => {
          if (!bulkProcessing) {
            setBulkMoveModal(false);
            setBulkDestinationFolderId(null);
          }
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setBulkMoveModal(false);
                setBulkDestinationFolderId(null);
              }}
              disabled={bulkProcessing}
            >
              Hủy
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleBulkMove}
              disabled={bulkProcessing || bulkDestinationFolderId === null}
            >
              {bulkProcessing ? "Đang di chuyển..." : "Di chuyển"}
            </button>
          </>
        }
      >
        <p>
          Đã chọn{" "}
          <strong>{selectedFileIds.length + selectedFolderIds.length}</strong>{" "}
          mục.
        </p>

        <p>Chọn thư mục đích:</p>

        <FolderPicker
          value={bulkDestinationFolderId}
          onChange={setBulkDestinationFolderId}
          disabledIds={selectedFolderIds}
        />
      </Modal>

      <Modal
        isOpen={bulkCopyModal}
        title="Sao chép các mục đã chọn"
        onClose={() => {
          if (!bulkProcessing) {
            setBulkCopyModal(false);
            setBulkDestinationFolderId(null);
          }
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setBulkCopyModal(false);
                setBulkDestinationFolderId(null);
              }}
              disabled={bulkProcessing}
            >
              Hủy
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleBulkCopy}
              disabled={bulkProcessing || bulkDestinationFolderId === null}
            >
              {bulkProcessing ? "Đang sao chép..." : "Sao chép"}
            </button>
          </>
        }
      >
        <p>
          Đã chọn{" "}
          <strong>{selectedFileIds.length + selectedFolderIds.length}</strong>{" "}
          mục.
        </p>

        <p>Chọn thư mục đích:</p>

        <FolderPicker
          value={bulkDestinationFolderId}
          onChange={setBulkDestinationFolderId}
          disabledIds={selectedFolderIds}
        />
      </Modal>

      <ConfirmDialog
        isOpen={bulkDeleteModal}
        title="Xóa các mục đã chọn"
        message={`Bạn có chắc muốn xóa ${
          selectedFileIds.length + selectedFolderIds.length
        } mục đã chọn? Các mục sẽ được chuyển vào thùng rác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        danger
        loading={bulkProcessing}
        onConfirm={handleBulkDeleteAll}
        onCancel={() => {
          if (!bulkProcessing) {
            setBulkDeleteModal(false);
          }
        }}
      />

      <Modal
        isOpen={createModal}
        title="Tạo thư mục"
        onClose={() => {
          if (!saving) {
            setCreateModal(false);
            setFolderName("");
          }
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setCreateModal(false);
                setFolderName("");
              }}
              disabled={saving}
            >
              Hủy
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateFolder}
              disabled={saving}
            >
              {saving ? "Đang tạo..." : "Tạo thư mục"}
            </button>
          </>
        }
      >
        <FormInput
          label="Tên thư mục"
          name="folderName"
          value={folderName}
          onChange={(event) => setFolderName(event.target.value)}
          placeholder="Nhập tên thư mục"
          disabled={saving}
          required
        />
      </Modal>

      <Modal
        isOpen={renameModal}
        title="Đổi tên thư mục"
        onClose={() => {
          if (!saving) {
            setRenameModal(false);
            setSelectedFolder(null);
            setFolderName("");
          }
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setRenameModal(false);
                setSelectedFolder(null);
                setFolderName("");
              }}
              disabled={saving}
            >
              Hủy
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRenameFolder}
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </>
        }
      >
        <FormInput
          label="Tên mới"
          name="folderName"
          value={folderName}
          onChange={(event) => setFolderName(event.target.value)}
          disabled={saving}
          required
        />
      </Modal>

      <FolderMoveDialog
        folder={selectedFolder}
        isOpen={moveModal}
        onClose={() => {
          if (!saving) {
            setMoveModal(false);
            setSelectedFolder(null);
          }
        }}
        onMoved={() => {
          setMoveModal(false);
          setSelectedFolder(null);
          refreshFolders();
        }}
      />

      <FolderCopyDialog
        folder={selectedFolder}
        isOpen={copyModal}
        onClose={() => {
          setCopyModal(false);
          setSelectedFolder(null);
        }}
        onCopied={() => {
          setCopyModal(false);
          setSelectedFolder(null);
          refreshFolders();
        }}
      />

      <ConfirmDialog
        isOpen={deleteModal}
        title="Xóa thư mục"
        message={`Bạn có chắc muốn xóa thư mục "${
          selectedFolder?.name || ""
        }"? Thư mục và dữ liệu bên trong sẽ được chuyển vào thùng rác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        danger
        loading={saving}
        onConfirm={handleDeleteFolder}
        onCancel={() => {
          if (!saving) {
            setDeleteModal(false);
            setSelectedFolder(null);
          }
        }}
      />

      <ShareDialog
        resource={shareFolder}
        isOpen={Boolean(shareFolder)}
        onClose={() => setShareFolder(null)}
      />

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
              openRenameModal(contextMenu.folder);
              setContextMenu(null);
            }}
          >
            ✏️ Đổi tên
          </button>

          <button
            type="button"
            onClick={() => {
              openMoveModal(contextMenu.folder);
              setContextMenu(null);
            }}
          >
            📂 Di chuyển
          </button>

          <button
            type="button"
            onClick={() => {
              openCopyModal(contextMenu.folder);
              setContextMenu(null);
            }}
          >
            📋 Sao chép
          </button>

          <button
            type="button"
            onClick={() => {
              setShareFolder({
                ...contextMenu.folder,
                type: "folder",
              });

              setContextMenu(null);
            }}
          >
            🔗 Chia sẻ
          </button>

          <button
            type="button"
            className="file-context-menu__danger"
            onClick={() => {
              openDeleteModal(contextMenu.folder);
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

function formatStorageSize(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024) {
    return `${value} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = -1;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  if (unitIndex === -1) {
    return `${Math.round(size)} B`;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
