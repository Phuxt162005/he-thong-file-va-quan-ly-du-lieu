import { useEffect, useState } from "react";

import Modal from "../Modal/Modal";
import Loading from "../Loading/Loading";

import fileService from "../../services/file.service";

import "./FilePreview.css";

export default function FilePreview({ file, isOpen, onClose }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !file) {
      return;
    }
    loadPreview();
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [isOpen, file]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fileService.previewFile(file._id);
      const blob = response.data;
      const objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    } catch (err) {
      setError(err?.message || "Không thể preview file.");
    } finally {
      setLoading(false);
    }
  };

  const extension = getExtension(file?.name);

  const renderContent = () => {
    if (loading) {
      return <Loading message="Đang tải preview..." />;
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }

    if (!url) {
      return null;
    }

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      return <img className="file-preview__image" src={url} alt={file?.name} />;
    }

    if (extension === "pdf") {
      return (
        <iframe className="file-preview__frame" src={url} title={file?.name} />
      );
    }

    if (["mp4", "webm", "ogg"].includes(extension)) {
      return <video className="file-preview__video" src={url} controls />;
    }

    if (["mp3", "wav", "ogg"].includes(extension)) {
      return <audio className="file-preview__audio" src={url} controls />;
    }

    return (
      <div className="file-preview__unsupported">
        <div>📄</div>

        <p>Định dạng file này không hỗ trợ Preview.</p>

        <button
          className="btn btn-primary"
          onClick={() => downloadBlob(url, file?.name)}
        >
          Download
        </button>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} title={file?.name || "Preview"} onClose={onClose}>
      <div className="file-preview">{renderContent()}</div>
    </Modal>
  );
}

function getExtension(name = "") {
  const parts = name.split(".");
  if (parts.length <= 1) {
    return "";
  }
  return parts.pop().toLowerCase();
}

function downloadBlob(url, fileName) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "file";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
