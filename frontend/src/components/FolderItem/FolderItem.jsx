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
}) {
  const handleContextMenu = (event) => {
    event.preventDefault();
    onContextMenu?.(event, folder);
  };

  return (
    <div className="folder-item" onContextMenu={handleContextMenu}>
      <button
        type="button"
        className="folder-item__main"
        onDoubleClick={() => onOpen?.(folder)}
      >
        <span className="folder-item__icon">📁</span>

        <span className="folder-item__name">{folder.name}</span>
      </button>

      <div className="folder-item__actions">
        <button
          type="button"
          className="folder-item__action"
          onClick={() => onRename?.(folder)}
          title="Đổi tên"
        >
          ✏️
        </button>

        <button
          type="button"
          className="folder-item__action"
          onClick={() => onMove?.(folder)}
          title="Di chuyển"
        >
          📂
        </button>

        <button
          type="button"
          className="folder-item__action"
          onClick={() => onCopy?.(folder)}
          title="Sao chép"
        >
          📋
        </button>

        <button
          type="button"
          className="folder-item__action"
          onClick={() => onShare?.(folder)}
          title="Chia sẻ"
        >
          🔗
        </button>

        <button
          type="button"
          className="folder-item__action"
          onClick={() => onDelete?.(folder)}
          title="Xóa"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
