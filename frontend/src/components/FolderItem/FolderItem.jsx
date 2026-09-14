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
      <button
        type="button"
        className="folder-item__main"
        onDoubleClick={() => onOpen?.(folder)}
        title={`Mở thư mục ${folder.name || "Không có tên"}`}
      >
        <span className="folder-item__icon" aria-hidden="true">
          📁
        </span>

        <span className="folder-item__name">
          {folder.name || "Không có tên"}
        </span>
      </button>

      <div className="folder-item__actions">
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
          className="folder-item__action"
          onClick={(event) => handleAction(event, onMove)}
          title="Di chuyển"
          aria-label={`Di chuyển ${folder.name || "thư mục"}`}
        >
          📂
        </button>

        <button
          type="button"
          className="folder-item__action"
          onClick={(event) => handleAction(event, onCopy)}
          title="Sao chép"
          aria-label={`Sao chép ${folder.name || "thư mục"}`}
        >
          📋
        </button>

        <button
          type="button"
          className="folder-item__action"
          onClick={(event) => handleAction(event, onShare)}
          title="Chia sẻ"
          aria-label={`Chia sẻ ${folder.name || "thư mục"}`}
        >
          🔗
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
      </div>
    </div>
  );
}
