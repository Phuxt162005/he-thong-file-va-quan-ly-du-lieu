import { useState } from "react";

import Modal from "../Modal/Modal";
import FolderPicker from "../FolderPicker/FolderPicker";

import fileService from "../../services/fileService";

export default function FileCopyDialog({ file, isOpen, onClose, onCopied }) {
  const [destinationFolderId, setDestinationFolderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCopy = async () => {
    try {
      setLoading(true);
      setError("");
      await fileService.copyFile(file._id, destinationFolderId);
      onCopied?.();
      onClose();
    } catch (err) {
      setError(err?.message || "Không thể sao chép file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Sao chép file"
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
            onClick={handleCopy}
            disabled={loading}
          >
            {loading ? "Đang sao chép..." : "Sao chép"}
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
