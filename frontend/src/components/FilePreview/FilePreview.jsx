import { useEffect, useState } from "react";

import Modal from "../Modal/Modal";
import Loading from "../Loading/Loading";

import fileService from "../../services/fileService";

import "./FilePreview.css";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
const VIDEO_EXTENSIONS = ["mp4", "webm", "ogg", "mov"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg", "m4a"];

export default function FilePreview({ file, isOpen, onClose }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    const loadPreview = async () => {
      if (!isOpen || !file?._id) {
        return;
      }

      try {
        setLoading(true);
        setError("");
        setUrl(null);
        const response = await fileService.previewFile(file._id);

        if (cancelled) {
          return;
        }

        const blob = response?.data;
        if (!(blob instanceof Blob)) {
          throw new Error("Dữ liệu preview không hợp lệ.");
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(err?.message || "Không thể preview file.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    loadPreview();
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isOpen, file?._id]);

  const extension = getExtension(file?.name);
  const renderContent = () => {
    if (loading) {
      return <Loading message="Đang tải preview..." />;
    }

    if (error) {
      return (
        <div className="file-preview__error">
          <div className="file-preview__error-icon">⚠️</div>

          <p>{error}</p>

          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      );
    }

    if (!url) {
      return null;
    }

    if (IMAGE_EXTENSIONS.includes(extension)) {
      return (
        <img
          className="file-preview__image"
          src={url}
          alt={file?.name || "Preview"}
        />
      );
    }

    if (extension === "pdf") {
      return (
        <iframe
          className="file-preview__frame"
          src={url}
          title={file?.name || "PDF Preview"}
        />
      );
    }

    if (VIDEO_EXTENSIONS.includes(extension)) {
      return (
        <video className="file-preview__video" src={url} controls playsInline>
          Trình duyệt không hỗ trợ phát video.
        </video>
      );
    }

    if (AUDIO_EXTENSIONS.includes(extension)) {
      return (
        <audio className="file-preview__audio" src={url} controls>
          Trình duyệt không hỗ trợ phát audio.
        </audio>
      );
    }

    return (
      <div className="file-preview__unsupported">
        <div className="file-preview__unsupported-icon">📄</div>

        <h3>Không hỗ trợ Preview</h3>

        <p>Định dạng file này chưa hỗ trợ xem trực tiếp.</p>

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
  const lastDot = name.lastIndexOf(".");
  if (lastDot === -1 || lastDot === name.length - 1) {
    return "";
  }
  return name.substring(lastDot + 1).toLowerCase();
}

function downloadBlob(url, fileName) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "file";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
