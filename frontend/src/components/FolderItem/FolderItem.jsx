import "./FolderItem.css";

export default function FolderItem({
  folder,
  selected = false,
  onSelect,
  onOpen,
  onRename,
  onMove,
  onCopy,
  onDelete,
  onShare,
  onContextMenu,
  onDropFile,
  onDropFolder,
}) {
  const action = (event, callback) => {
    event.preventDefault();
    event.stopPropagation();
    callback?.(folder);
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onContextMenu?.(event, folder);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();

    event.dataTransfer.dropEffect = "move";
    event.currentTarget.classList.add("folder-item--drag-over");
  };

  const handleDragLeave = (event) => {
    event.currentTarget.classList.remove("folder-item--drag-over");
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove("folder-item--drag-over");

    const fileId = event.dataTransfer.getData("application/x-file-id");
    const folderId = event.dataTransfer.getData("application/x-folder-id");
    if (fileId) {
      onDropFile?.(fileId, folder);
      return;
    }
    if (folderId) {
      onDropFolder?.(folderId, folder);
    }
  };

  return (
    <div
      className={`folder-item ${selected ? "folder-item--selected" : ""}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(
          "application/x-folder-id",
          String(folder._id),
        );
      }}
      onContextMenu={handleContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="folder-item__select">
        <input
          type="checkbox"
          checked={selected}
          onChange={(event) => onSelect?.(folder, event.target.checked)}
          onPointerDown={(event) => {
            event.stopPropagation();

            window.dispatchEvent(
              new CustomEvent("file-manager-range-start", {
                detail: {
                  type: "folder",
                  id: folder._id,
                },
              }),
            );
          }}
          onPointerEnter={() => {
            window.dispatchEvent(
              new CustomEvent("file-manager-range-enter", {
                detail: { type: "folder", id: folder._id },
              }),
            );
          }}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Chọn ${folder.name || "thư mục"}`}
        />
      </div>

      <button
        type="button"
        className="folder-item__name-cell"
        onDoubleClick={() => onOpen?.(folder)}
        title={`Mở thư mục ${folder.name || "Không có tên"}`}
      >
        <span className="folder-item__icon" aria-hidden="true">
          <svg viewBox="0 0 48 48">
            <path
              d="M5 12.5A4.5 4.5 0 0 1 9.5 8h10l4 4h15A4.5 4.5 0 0 1 43 16.5v20a3.5 3.5 0 0 1-3.5 3.5h-31A3.5 3.5 0 0 1 5 36.5z"
              fill="#65a8ef"
            />

            <path
              d="M5 17h38v19.5a3.5 3.5 0 0 1-3.5 3.5h-31A3.5 3.5 0 0 1 5 36.5z"
              fill="#5b9ee8"
            />
          </svg>
        </span>

        <span className="folder-item__name">
          {folder.name || "Không có tên"}
        </span>
      </button>

      <div className="folder-item__type">Thư mục</div>

      <div className="folder-item__size">-</div>

      <div className="folder-item__date">
        {formatDate(folder.updatedAt || folder.createdAt)}
      </div>

      <div className="folder-item__actions">
        <button
          type="button"
          className="folder-item__action folder-item__action--view"
          onClick={(event) => action(event, onOpen)}
          title="Mở thư mục"
          aria-label="Mở thư mục"
        >
          <EyeIcon />
        </button>

        <button
          type="button"
          className="folder-item__action folder-item__action--share"
          onClick={(event) => action(event, onShare)}
          title="Chia sẻ"
          aria-label="Chia sẻ"
        >
          <ShareIcon />
        </button>

        <button
          type="button"
          className="folder-item__action"
          onClick={(event) => action(event, onRename)}
          title="Đổi tên"
          aria-label="Đổi tên"
        >
          <EditIcon />
        </button>

        <button
          type="button"
          className="folder-item__action folder-item__action--danger"
          onClick={(event) => action(event, onDelete)}
          title="Xóa"
          aria-label="Xóa"
        >
          <TrashIcon />
        </button>

        <button
          type="button"
          className="folder-item__action"
          onClick={handleContextMenu}
          title="Thêm thao tác"
          aria-label="Thêm thao tác"
        >
          <MoreIcon />
        </button>
      </div>
    </div>
  );
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

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path
        d="M7 12v7h10v-7M12 15V4m0 0-4 4m4-4 4 4"
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
