import { useEffect, useState } from "react";

import Modal from "../Modal/Modal";
import FolderPicker from "../FolderPicker/FolderPicker";

import folderService from "../../services/folderService";

export default function FolderMoveDialog({ folder, isOpen, onClose, onMoved }) {
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

  async function handleMove() {
    if (!folder?._id) {
      return;
    }

    if (
      destinationFolderId &&
      String(destinationFolderId) === String(folder._id)
    ) {
      setError("Không thể di chuyển thư mục vào chính nó.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await folderService.moveFolder(folder._id, destinationFolderId);

      onMoved?.();
      onClose();
    } catch (err) {
      setError(err?.message || "Không thể di chuyển thư mục.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={`Di chuyển "${folder?.name || "thư mục"}"`}
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
            onClick={handleMove}
            disabled={loading}
          >
            {loading ? "Đang di chuyển..." : "Di chuyển"}
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
