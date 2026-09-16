import "./FolderItem.css";

export default function FolderItem({
  folder,
  onOpen,
  onRename,
  onMove,
  onCopy,
  onDelete,
  onShare,
  onContextMenu,
  onDropFile,
}) {
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
    event.preventDefault();
    event.stopPropagation();

    event.currentTarget.classList.remove("folder-item--drag-over");
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    event.currentTarget.classList.remove("folder-item--drag-over");

    const fileId = event.dataTransfer.getData("application/x-file-id");

    if (!fileId) {
      return;
    }

    onDropFile?.(fileId, folder);
  };

  const handleAction = (event, callback) => {
    event.preventDefault();
    event.stopPropagation();

    callback?.(folder);
  };

  return (
    <div
      className="folder-item"
      onContextMenu={handleContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Checkbox */}
      <div className="folder-item__select" aria-hidden="true" />

      {/* Tên */}
      <button
        type="button"
        className="folder-item__name-cell"
        onDoubleClick={() => onOpen?.(folder)}
        title={`Mở thư mục ${folder.name || "Không có tên"}`}
      >
        <span className="folder-item__icon" aria-hidden="true">
          <svg viewBox="0 0 48 48">
            <path
              d="M5 12.5C5 10.01 7.01 8 9.5 8h10.2l4 4H38.5c2.49 0 4.5 2.01 4.5 4.5v18c0 3.04-2.46 5.5-5.5 5.5h-27C7.46 40 5 37.54 5 34.5v-22Z"
              fill="#FFD15C"
            />
            <path
              d="M5 17h38v17.5c0 3.04-2.46 5.5-5.5 5.5h-27C7.46 40 5 37.54 5 34.5V17Z"
              fill="#FFC247"
            />
            <path d="M5 17h38" stroke="#E7A92E" strokeWidth="1.5" />
          </svg>
        </span>

        <span className="folder-item__name">
          {folder.name || "Không có tên"}
        </span>
      </button>

      {/* Loại */}
      <div className="folder-item__type">Thư mục</div>

      {/* Dung lượng */}
      <div className="folder-item__size">-</div>

      {/* Cập nhật */}
      <div className="folder-item__date">
        {formatFolderDate(folder.updatedAt || folder.createdAt)}
      </div>

      {/* Thao tác */}
      <div className="folder-item__actions">
        <button
          type="button"
          className="folder-item__action folder-item__action--view"
          onClick={(event) => handleAction(event, onOpen)}
          title="Mở thư mục"
          aria-label={`Mở ${folder.name || "thư mục"}`}
        >
          👁
        </button>

        <button
          type="button"
          className="folder-item__action folder-item__action--share"
          onClick={(event) => handleAction(event, onShare)}
          title="Chia sẻ"
          aria-label={`Chia sẻ ${folder.name || "thư mục"}`}
        >
          🔗
        </button>

        <button
          type="button"
          className="folder-item__action"
          onClick={(event) => handleAction(event, onRename)}
          title="Đổi tên"
          aria-label={`Đổi tên ${folder.name || "thư mục"}`}
        >
          ✏️
        </button>

        <button
          type="button"
          className="folder-item__action folder-item__action--danger"
          onClick={(event) => handleAction(event, onDelete)}
          title="Xóa"
          aria-label={`Xóa ${folder.name || "thư mục"}`}
        >
          🗑️
        </button>

        <button
          type="button"
          className="folder-item__action"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onContextMenu?.(event, folder);
          }}
          title="Thêm thao tác"
          aria-label={`Thêm thao tác cho ${folder.name || "thư mục"}`}
        >
          ⋯
        </button>
      </div>
    </div>
  );
}

function formatFolderDate(date) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleString("vi-VN");
}
