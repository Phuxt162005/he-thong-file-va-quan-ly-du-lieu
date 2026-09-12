import { useEffect, useRef, useState } from "react";

import Modal from "../Modal/Modal";
import Loading from "../Loading/Loading";

import fileService from "../../services/fileService";

import "./FilePreview.css";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
const VIDEO_EXTENSIONS = ["mp4", "webm", "ogg", "mov"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg", "m4a"];
const TEXT_EXTENSIONS = [
  "txt",
  "md",
  "csv",
  "json",
  "xml",
  "html",
  "css",
  "js",
  "jsx",
  "ts",
  "tsx",
  "java",
  "py",
  "c",
  "cpp",
  "h",
  "hpp",
  "sql",
  "log",
];

export default function FilePreview({
  file,
  isOpen,
  onClose,
  previewUrl = null,
}) {
  const [url, setUrl] = useState(null);
  const [textContent, setTextContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const imageDragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    async function loadPreview() {
      if (!isOpen || !file?._id) {
        return;
      }

      try {
        setLoading(true);
        setError("");
        setUrl(null);
        setTextContent("");

        const response = await fileService.previewFile(file._id);
        const blob = response?.data;
        if (!(blob instanceof Blob)) {
          throw new Error("Dữ liệu preview không hợp lệ.");
        }

        const extension = getExtension(file?.name);
        if (TEXT_EXTENSIONS.includes(extension)) {
          const text = await blob.text();
          if (!cancelled) {
            setTextContent(text);
          }
          return;
        }
        objectUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setUrl(objectUrl);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Không thể preview file.";

        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    if (previewUrl) {
      setUrl(previewUrl);
      setLoading(false);
      return;
    }

    loadPreview();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isOpen, file?._id]);

  useEffect(() => {
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
    setIsDraggingImage(false);
  }, [isOpen, file?._id]);

  const extension = getExtension(file?.name);

  const IMAGE_ZOOM_MIN = 0.25;
  const IMAGE_ZOOM_MAX = 4;
  const IMAGE_ZOOM_STEP = 0.25;

  function clampImageZoom(value) {
    return Math.min(IMAGE_ZOOM_MAX, Math.max(IMAGE_ZOOM_MIN, value));
  }

  function zoomImage(direction) {
    setImageZoom((current) => {
      const next =
        direction === "in"
          ? current + IMAGE_ZOOM_STEP
          : current - IMAGE_ZOOM_STEP;

      return clampImageZoom(next);
    });
  }

  function resetImageView() {
    setImageZoom(1);
    setImagePosition({
      x: 0,
      y: 0,
    });
  }

  function handleImageWheel(event) {
    event.preventDefault();

    setImageZoom((current) => {
      const next =
        event.deltaY < 0
          ? current + IMAGE_ZOOM_STEP
          : current - IMAGE_ZOOM_STEP;

      return clampImageZoom(next);
    });
  }

  function handleImagePointerDown(event) {
    if (imageZoom <= 1) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDraggingImage(true);

    imageDragStart.current = {
      x: event.clientX - imagePosition.x,
      y: event.clientY - imagePosition.y,
    };
  }

  function handleImagePointerMove(event) {
    if (!isDraggingImage) {
      return;
    }
    setImagePosition({
      x: event.clientX - imageDragStart.current.x,
      y: event.clientY - imageDragStart.current.y,
    });
  }

  function handleImagePointerUp(event) {
    if (!isDraggingImage) {
      return;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDraggingImage(false);
  }

  function renderContent() {
    if (loading) {
      return <Loading message="Đang tải preview..." />;
    }

    if (error) {
      return (
        <div className="file-preview__error">
          <div className="file-preview__error-icon">⚠️</div>

          <p>{error}</p>

          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      );
    }

    if (TEXT_EXTENSIONS.includes(extension)) {
      return <pre className="file-preview__text">{textContent}</pre>;
    }
    if (!url) {
      return null;
    }
    if (IMAGE_EXTENSIONS.includes(extension)) {
      return (
        <div className="file-preview__image-wrapper">
          <div className="file-preview__image-toolbar">
            <button
              type="button"
              className="file-preview__image-tool"
              onClick={() => zoomImage("out")}
              disabled={imageZoom <= IMAGE_ZOOM_MIN}
              aria-label="Thu nhỏ ảnh"
              title="Thu nhỏ"
            >
              −
            </button>

            <span className="file-preview__zoom-value">
              {Math.round(imageZoom * 100)}%
            </span>

            <button
              type="button"
              className="file-preview__image-tool"
              onClick={() => zoomImage("in")}
              disabled={imageZoom >= IMAGE_ZOOM_MAX}
              aria-label="Phóng to ảnh"
              title="Phóng to"
            >
              +
            </button>

            <span className="file-preview__toolbar-divider" />

            <button
              type="button"
              className="file-preview__image-tool"
              onClick={resetImageView}
              aria-label="Đặt lại ảnh"
              title="Đặt lại"
            >
              ↺
            </button>
          </div>

          <div
            className={`file-preview__image-stage ${
              isDraggingImage ? "is-dragging" : ""
            }`}
            onWheel={handleImageWheel}
            onPointerDown={handleImagePointerDown}
            onPointerMove={handleImagePointerMove}
            onPointerUp={handleImagePointerUp}
            onPointerCancel={handleImagePointerUp}
          >
            <img
              className="file-preview__image"
              src={url}
              alt={file?.name || "Preview"}
              draggable={false}
              style={{
                transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imageZoom})`,
              }}
            />
          </div>
        </div>
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

        <p>Vui lòng đóng cửa sổ Preview và sử dụng chức năng Download.</p>

        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Đóng
        </button>
      </div>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      title={file?.name || "Preview"}
      onClose={onClose}
      className="file-preview-modal"
    >
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
