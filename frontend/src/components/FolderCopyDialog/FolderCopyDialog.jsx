import { useEffect, useState } from "react";

import Modal from "../Modal/Modal";
import FolderPicker from "../FolderPicker/FolderPicker";

import folderService from "../../services/folderService";

export default function FolderCopyDialog({
  folder,
  isOpen,
  onClose,
  onCopied,
}) {
  const [destinationFolderId, setDestinationFolderId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDestinationFolderId(null);
    setError("");
  }, [isOpen, folder?._id]);

  async function handleCopy() {
    if (!folder?._id) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      await folderService.copyFolder(folder._id, destinationFolderId);

      onCopied?.();
      onClose();
    } catch (err) {
      setError(err?.message || "Không thể sao chép thư mục.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={`Sao chép "${folder?.name || "thư mục"}"`}
      onClose={() => {
        if (!loading) {
          onClose();
        }
      }}
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCopy}
            disabled={loading}
          >
            {loading ? "Đang sao chép..." : "Sao chép"}
          </button>
        </>
      }
    >
      {error && <div className="error-message">{error}</div>}

      <p>Chọn thư mục đích:</p>

      <FolderPicker
        value={destinationFolderId}
        onChange={setDestinationFolderId}
        disabledIds={folder?._id ? [folder._id] : []}
      />
    </Modal>
  );
}
