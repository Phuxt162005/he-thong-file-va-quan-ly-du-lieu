import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import FileUpload from "../../components/FileUpload/FileUpload";
import MainLayout from "../../layouts/MainLayout/MainLayout";
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

import FileList from "./FileList";

import "./Files.css";

export default function Files() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentFolderId = searchParams.get("folder");
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

  useEffect(() => {
    loadFolders();
  }, [currentFolderId]);

  useEffect(() => {
    function handleDocumentClick() {
      setContextMenu(null);
    }
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

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

    setContextMenu({
      folder,
      x: event.clientX,
      y: event.clientY,
    });
  }

  return (
    <MainLayout>
      <div className="files-page">
        <Breadcrumb />

        <div className="files-page__header">
          <div>
            <h1>Tệp của tôi</h1>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setError("");
              setFolderName("");
              setCreateModal(true);
            }}
          >
            + Thư mục mới
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

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
              🏠 Tất cả tệp
            </button>

            <FolderTree
              selectedFolderId={currentFolderId}
              onSelect={handleSelectFolder}
              refreshKey={refreshKey}
            />
          </aside>

          <section className="folder-manager__content">
            <div className="folder-manager__content-header">
              <h2>Thư mục</h2>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={refreshFolders}
              >
                ↻ Làm mới
              </button>
            </div>

            {loading ? (
              <Loading message="Đang tải thư mục..." />
            ) : folders.length === 0 ? (
              <div className="folder-list__empty">Chưa có thư mục.</div>
            ) : (
              <div className="folder-list">
                {folders.map((folder) => (
                  <FolderItem
                    key={folder._id}
                    folder={folder}
                    onOpen={handleOpenFolder}
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
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="files-page__section">
          <div className="files-page__section-header">
            <h2>File</h2>
          </div>

          <FileUpload folderId={currentFolderId} onUploaded={refreshFolders} />

          <FileList />
        </div>
      </div>

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
        message={`Bạn có chắc muốn xóa thư mục "${selectedFolder?.name || ""}"? Thư mục và dữ liệu bên trong sẽ được chuyển vào thùng rác.`}
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
          className="folder-context-menu"
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
            className="folder-context-menu__danger"
            onClick={() => {
              openDeleteModal(contextMenu.folder);
              setContextMenu(null);
            }}
          >
            🗑️ Xóa
          </button>
        </div>
      )}
    </MainLayout>
  );
}
