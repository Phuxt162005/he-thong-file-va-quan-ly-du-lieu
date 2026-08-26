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
  const [createModal, setCreateModal] = useState(false);
  const [renameModal, setRenameModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderName, setFolderName] = useState("");
  const [saving, setSaving] = useState(false);
  const [shareFolder, setShareFolder] = useState(null);

  useEffect(() => {
    loadFolders();
  }, [currentFolderId]);

  //   load folder
  const loadFolders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await folderService.getFolders(currentFolderId);
      setFolders(response?.data || response || []);
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách thư mục.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFolder = (folder) => {
    navigate(`/files?folder=${folder._id}`);
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
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
      await loadFolders();
    } catch (err) {
      setError(err?.message || "Không thể tạo thư mục.");
    } finally {
      setSaving(false);
    }
  };

  const openRenameModal = (folder) => {
    setSelectedFolder(folder);
    setFolderName(folder.name || "");
    setRenameModal(true);
  };

  const handleRenameFolder = async () => {
    if (!selectedFolder || !folderName.trim()) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      await folderService.renameFolder(selectedFolder._id, folderName.trim());
      setFolders((prev) =>
        prev.map((folder) =>
          folder._id === selectedFolder._id
            ? { ...folder, name: folderName.trim() }
            : folder,
        ),
      );

      setRenameModal(false);
      setSelectedFolder(null);
      setFolderName("");
    } catch (err) {
      setError(err?.message || "Không thể đổi tên thư mục.");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (folder) => {
    setSelectedFolder(folder);
    setDeleteModal(true);
  };

  const handleDeleteFolder = async () => {
    if (!selectedFolder) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      await folderService.deleteFolder(selectedFolder._id);
      setFolders((prev) =>
        prev.filter((folder) => folder._id !== selectedFolder._id),
      );
      setDeleteModal(false);
      setSelectedFolder(null);
    } catch (err) {
      setError(err?.message || "Không thể xóa thư mục.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="files-page">
        <Breadcrumb />
        <div className="files-page__header">
          <div>
            <h1>Tệp của tôi</h1>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setCreateModal(true)}
          >
            + Thư mục mới
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <Loading message="Đang tải thư mục..." />
        ) : (
          <div className="folder-list">
            {folders.length === 0 ? (
              <div className="folder-list__empty">Chưa có thư mục.</div>
            ) : (
              folders.map((folder) => (
                <FolderItem
                  key={folder._id}
                  folder={folder}
                  onOpen={handleOpenFolder}
                  onRename={openRenameModal}
                  onDelete={openDeleteModal}
                  onShare={(folder) =>
                    setShareFolder({ ...folder, type: "folder" })
                  }
                />
              ))
            )}
          </div>
        )}

        <div className="files-page__section">
          <div className="files-page__section-header">
            <h2>File</h2>
          </div>
          <FileUpload folderId={currentFolderId} onUploaded={loadFolders} />
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

      <ConfirmDialog
        isOpen={deleteModal}
        title="Xóa thư mục"
        message={`Bạn có chắc muốn xóa thư mục "${selectedFolder?.name || ""}"?`}
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
    </MainLayout>
  );
}

function FolderItem({ folder, onOpen, onRename, onDelete }) {
  return (
    <div className="folder-item">
      <button
        className="folder-item__main"
        onDoubleClick={() => onOpen(folder)}
      >
        <span className="folder-item__icon">📁</span>

        <span className="folder-item__name">{folder.name}</span>
      </button>

      <div className="folder-item__actions">
        <button
          className="folder-item__action"
          onClick={() => onRename(folder)}
          title="Đổi tên"
        >
          ✏️
        </button>

        <button
          className="folder-item__action"
          onClick={() => onShare(folder)}
          title="Chia sẻ"
        >
          🔗
        </button>

        <button
          className="folder-item__action"
          onClick={() => onDelete(folder)}
          title="Xóa"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
