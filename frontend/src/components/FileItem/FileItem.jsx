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
  onContextMenu,
  onDragStart,
  downloading = false,
}) {
  function handleSelect() {
    onSelect?.(file, !selected);
  }

  function handleDoubleClick() {
    onOpen?.(file);
  }

  function handleContextMenu(event) {
    event.preventDefault();
    event.stopPropagation();

    onContextMenu?.(event, file);
  }

  function handleDragStart(event) {
    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData("application/x-file-id", String(file._id));

    onDragStart?.(file);
  }

  function handleAction(event, callback) {
    event.preventDefault();
    event.stopPropagation();

    callback?.(file);
  }

  return (
    <div
      className={selected ? "file-item file-item--selected" : "file-item"}
      draggable
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
    >
      {/* Checkbox */}
      <div className="file-item__select">
        <input
          type="checkbox"
          checked={selected}
          onChange={handleSelect}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Chọn ${file.name || "file"}`}
        />
      </div>

      {/* Tên + icon */}
      <div className="file-item__name-cell">
        <div className="file-item__icon" aria-hidden="true">
          {getFileIcon(file)}
        </div>

        <div className="file-item__name">
          <span title={file.name}>{file.name || "Không có tên"}</span>
        </div>
      </div>

      {/* Loại */}
      <div className="file-item__type">{getFileType(file)}</div>

      {/* Dung lượng */}
      <div className="file-item__size">{formatFileSize(file.size)}</div>

      {/* Cập nhật */}
      <div className="file-item__date">
        {formatDate(file.updatedAt || file.createdAt)}
      </div>

      {/* Thao tác */}
      <div className="file-item__actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm file-item__action"
          onClick={(event) => handleAction(event, onPreview)}
          title="Xem trước"
          aria-label={`Xem trước ${file.name || "file"}`}
          disabled={downloading}
        >
          👁
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm file-item__action file-item__action--download"
          onClick={(event) => handleAction(event, onDownload)}
          title="Tải xuống"
          aria-label={`Tải xuống ${file.name || "file"}`}
          disabled={downloading}
        >
          {downloading ? "⏳" : "⬇"}
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm file-item__action"
          onClick={(event) => handleAction(event, onRename)}
          title="Đổi tên"
          aria-label={`Đổi tên ${file.name || "file"}`}
          disabled={downloading}
        >
          ✏️
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm file-item__action file-item__action--danger"
          onClick={(event) => handleAction(event, onDelete)}
          title="Xóa"
          aria-label={`Xóa ${file.name || "file"}`}
          disabled={downloading}
        >
          🗑️
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm file-item__action file-item__action-more"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();

            onContextMenu?.(event, file);
          }}
          title="Thêm thao tác"
          aria-label={`Thêm thao tác cho ${file.name || "file"}`}
          disabled={downloading}
        >
          ⋯
        </button>
      </div>
    </div>
  );
}

function getFileType(file) {
  if (!file?.name) {
    return "FILE";
  }

  const parts = file.name.split(".");

  if (parts.length < 2) {
    return "FILE";
  }

  return parts.pop().toUpperCase();
}

function getFileIcon(file) {
  const extension = file?.extension || getExtension(file?.name);

  const ext = extension.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return "🖼️";
  }

  if (ext === "pdf") {
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

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return (bytes / Math.pow(1024, index)).toFixed(2) + " " + units[index];
}

function formatDate(date) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleString("vi-VN");
}

export default FileItem;
