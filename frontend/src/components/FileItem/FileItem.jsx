import "./FileItem.css";

export default function FileItem({
  file,
  selected = false,
  onSelect,
  onOpen,
  onDownload,
  onPreview,
  onRename,
  onDelete,
  onContextMenu,
  onDragStart,
  downloading = false,
}) {
  const action = (event, callback) => {
    event.preventDefault();
    event.stopPropagation();
    callback?.(file);
  };

  return (
    <div
      className={selected ? "file-item file-item--selected" : "file-item"}
      draggable
      onDoubleClick={() => onOpen?.(file)}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onContextMenu?.(event, file);
      }}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/x-file-id", String(file._id));
        onDragStart?.(file);
      }}
    >
      <div className="file-item__select">
        <input
          type="checkbox"
          checked={selected}
          onChange={(event) => onSelect?.(file, event.target.checked)}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Chọn ${file.name || "file"}`}
        />
      </div>

      <div className="file-item__name-cell">
        <div className="file-item__icon" aria-hidden="true">
          <FileTypeIcon file={file} />
        </div>

        <div className="file-item__name">
          <span title={file.name}>{file.name || "Không có tên"}</span>
        </div>
      </div>

      <div className="file-item__type">{getFileType(file)}</div>

      <div className="file-item__size">{formatFileSize(file.size)}</div>

      <div className="file-item__date">
        {formatDate(file.updatedAt || file.createdAt)}
      </div>

      <div className="file-item__actions">
        <button
          type="button"
          className="file-item__action file-item__action--view"
          onClick={(event) => action(event, onPreview)}
          title="Xem trước"
          aria-label="Xem trước"
        >
          <EyeIcon />
        </button>

        <button
          type="button"
          className="file-item__action file-item__action--download"
          onClick={(event) => action(event, onDownload)}
          title="Tải xuống"
          aria-label="Tải xuống"
          disabled={downloading}
        >
          <DownloadIcon />
        </button>

        <button
          type="button"
          className="file-item__action"
          onClick={(event) => action(event, onRename)}
          title="Đổi tên"
          aria-label="Đổi tên"
        >
          <EditIcon />
        </button>

        <button
          type="button"
          className="file-item__action file-item__action--danger"
          onClick={(event) => action(event, onDelete)}
          title="Xóa"
          aria-label="Xóa"
        >
          <TrashIcon />
        </button>

        <button
          type="button"
          className="file-item__action"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onContextMenu?.(event, file);
          }}
          title="Thêm thao tác"
          aria-label="Thêm thao tác"
        >
          <MoreIcon />
        </button>
      </div>
    </div>
  );
}

function FileTypeIcon({ file }) {
  const ext = getExtension(file?.name).toLowerCase();

  const config = {
    pdf: ["#ef476f", "PDF"],

    doc: ["#2f80ed", "W"],
    docx: ["#2f80ed", "W"],

    xls: ["#25a66a", "X"],
    xlsx: ["#25a66a", "X"],
    csv: ["#25a66a", "X"],

    ppt: ["#f05a24", "P"],
    pptx: ["#f05a24", "P"],

    png: ["#35b98b", "IMG"],
    jpg: ["#35b98b", "IMG"],
    jpeg: ["#35b98b", "IMG"],
    webp: ["#35b98b", "IMG"],

    zip: ["#9347e8", "ZIP"],
    rar: ["#9347e8", "ZIP"],
    "7z": ["#9347e8", "ZIP"],

    txt: ["#7f9abb", "TXT"],
    md: ["#7f9abb", "TXT"],
  }[ext] || ["#7f9abb", ext ? ext.slice(0, 3).toUpperCase() : "FILE"];

  return (
    <svg viewBox="0 0 42 48" className="file-type-icon">
      <path d="M7 2h19l9 9v33H7z" fill={config[0]} />

      <path d="M26 2v10h9" fill="#fff" opacity=".45" />

      <text
        x="21"
        y="31"
        textAnchor="middle"
        fill="#fff"
        fontSize={config[1] === "IMG" ? "6" : "13"}
        fontWeight="700"
        fontFamily="Arial,sans-serif"
      >
        {config[1]}
      </text>
    </svg>
  );
}

function getExtension(name = "") {
  const parts = name.split(".");

  return parts.length > 1 ? parts.pop() : "";
}

function getFileType(file) {
  const extension = getExtension(file?.name);

  return extension ? extension.toUpperCase() : "FILE";
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
  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString("vi-VN") : "-";
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path
        d="M2.5 12s3.4-5 9.5-5 9.5 5 9.5 5-3.4 5-9.5 5-9.5-5-9.5-5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />

      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path
        d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path
        d="m4 16.5-.8 4.3 4.3-.8L18.7 8.8l-3.5-3.5zM13.8 6.7l3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path
        d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v6M14 11v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="1.8" fill="currentColor" />

      <circle cx="12" cy="12" r="1.8" fill="currentColor" />

      <circle cx="19" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}
