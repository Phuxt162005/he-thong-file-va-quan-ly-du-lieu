import "./FileItem.css";

function FileItem({
  file,
  selected = false,
  onSelect,
  onOpen,
  onDownload,
  onPreview,
  onRename,
  onMove,
  onCopy,
  onDelete,
  onPermission,
  onShare,
  downloading = false,
}) {
  const handleSelect = () => {
    if (onSelect) {
      onSelect(file, !selected);
    }
  };

  const handleDoubleClick = () => {
    if (onOpen) {
      onOpen(file);
    }
  };

  return (
    <div
      className={selected ? "file-item file-item--selected" : "file-item"}
      onDoubleClick={handleDoubleClick}
    >
      <div className="file-item__select">
        <input
          type="checkbox"
          checked={selected}
          onChange={handleSelect}
          onClick={(event) => event.stopPropagation()}
        />
      </div>

      <div className="file-item__icon">{getFileIcon(file)}</div>

      <div className="file-item__name">
        <span title={file.name}>{file.name}</span>
      </div>

      <div className="file-item__size">{formatFileSize(file.size)}</div>

      <div className="file-item__date">
        {formatDate(file.updatedAt || file.createdAt)}
      </div>

      <div className="file-item__actions">
        <button
          onClick={() => onPreview?.(file)}
          title="Preview"
          disabled={downloading}
        >
          👁
        </button>
        <button
          onClick={() => onDownload?.(file)}
          title="Download"
          disabled={downloading}
        >
          {downloading ? "⏳" : "⬇"}
        </button>
        <button
          onClick={() => onRename?.(file)}
          title="Đổi tên"
          disabled={downloading}
        >
          ✏️
        </button>
        <button
          onClick={() => onMove?.(file)}
          title="Di chuyển"
          disabled={downloading}
        >
          📂
        </button>
        <button
          onClick={() => onCopy?.(file)}
          title="Sao chép"
          disabled={downloading}
        >
          📋
        </button>
        <button
          onClick={() => onPermission?.(file)}
          title="Quản lý quyền"
          disabled={downloading}
        >
          🔐
        </button>
        <button
          onClick={() => onShare?.(file)}
          title="Chia sẻ"
          disabled={downloading}
        >
          🔗
        </button>
        <button
          onClick={() => onDelete?.(file)}
          title="Xóa"
          disabled={downloading}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

function getFileIcon(file) {
  const extension = file?.extension || getExtension(file?.name);
  const ext = extension.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return "🖼️";
  }

  if (["pdf"].includes(ext)) {
    return "📕";
  }

  if (["doc", "docx"].includes(ext)) {
    return "📘";
  }

  if (["xls", "xlsx"].includes(ext)) {
    return "📗";
  }

  if (["ppt", "pptx"].includes(ext)) {
    return "📙";
  }

  if (["zip", "rar", "7z"].includes(ext)) {
    return "🗜️";
  }

  if (["mp4", "avi", "mkv", "mov"].includes(ext)) {
    return "🎬";
  }

  if (["mp3", "wav"].includes(ext)) {
    return "🎵";
  }

  if (["js", "jsx", "ts", "tsx", "css", "html", "json"].includes(ext)) {
    return "💻";
  }

  return "📄";
}

function getExtension(name = "") {
  const parts = name.split(".");
  if (parts.length <= 1) {
    return "";
  }
  return parts.pop();
}

function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined || bytes === 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, index)).toFixed(2) + " " + units[index];
}

function formatDate(date) {
  if (!date) {
    return "-";
  }
  return new Date(date).toLocaleString("vi-VN");
}

export default FileItem;
