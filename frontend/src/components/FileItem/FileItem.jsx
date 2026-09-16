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
          <FileTypeIcon file={file} />
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

function FileTypeIcon({ file }) {
  const extension = (file?.extension || getExtension(file?.name)).toLowerCase();

  let label = "FILE";
  let fill = "#64748B";
  let pageFill = "#F8FAFC";

  if (extension === "pdf") {
    label = "PDF";
    fill = "#E05252";
    pageFill = "#FFF1F2";
  } else if (["doc", "docx"].includes(extension)) {
    label = "DOC";
    fill = "#3978D5";
    pageFill = "#EFF6FF";
  } else if (["xls", "xlsx", "csv"].includes(extension)) {
    label = "XLS";
    fill = "#3A9B68";
    pageFill = "#ECFDF5";
  } else if (["ppt", "pptx"].includes(extension)) {
    label = "PPT";
    fill = "#D86B35";
    pageFill = "#FFF7ED";
  } else if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
    label = "IMG";
    fill = "#8B63C7";
    pageFill = "#F5F3FF";
  } else if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    label = "ZIP";
    fill = "#A9782D";
    pageFill = "#FFFBEB";
  } else if (
    ["js", "jsx", "ts", "tsx", "css", "html", "json"].includes(extension)
  ) {
    label = extension.toUpperCase().slice(0, 4);
    fill = "#5969C8";
    pageFill = "#EEF2FF";
  } else if (["mp4", "avi", "mkv", "mov"].includes(extension)) {
    label = "VID";
    fill = "#C85A87";
    pageFill = "#FDF2F8";
  } else if (["mp3", "wav", "flac", "aac"].includes(extension)) {
    label = "AUD";
    fill = "#7A62B8";
    pageFill = "#F5F3FF";
  } else if (extension) {
    label = extension.toUpperCase().slice(0, 4);
  }

  return (
    <svg viewBox="0 0 48 48" className="file-type-icon" aria-hidden="true">
      <path
        d="M10 4h18l10 10v28c0 1.1-.9 2-2 2H10c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z"
        fill={pageFill}
        stroke={fill}
        strokeWidth="1.5"
      />

      <path d="M28 4v10h10" fill="none" stroke={fill} strokeWidth="1.5" />

      <rect x="8" y="27" width="30" height="12" rx="2" fill={fill} />

      <text
        x="23"
        y="35.5"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="#ffffff"
        fontFamily="Arial, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
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
