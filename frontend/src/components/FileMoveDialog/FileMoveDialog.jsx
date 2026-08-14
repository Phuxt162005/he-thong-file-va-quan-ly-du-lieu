import { useState } from "react";

import Modal from "../Modal/Modal";
import FolderPicker from "../FolderPicker/FolderPicker";

import fileService from "../../services/file.service";

export default function FileMoveDialog({ file, isOpen, onClose, onMoved }) {
  const [destinationFolderId, setDestinationFolderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMove = async () => {
    try {
      setLoading(true);
      setError("");
      await fileService.moveFile(file._id, destinationFolderId);
      onMoved?.();
      onClose();
    } catch (err) {
      setError(err?.message || "Không thể di chuyển file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Di chuyển file"
      onClose={() => {
        if (!loading) {
          onClose();
        }
      }}
      footer={
        <>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </button>

          <button
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

      <FolderPicker
        value={destinationFolderId}
        onChange={setDestinationFolderId}
      />
    </Modal>
  );
}
