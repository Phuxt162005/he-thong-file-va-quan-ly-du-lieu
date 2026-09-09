import { useState } from "react";

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
  const [dragOver, setDragOver] = useState(false);

  const handleContextMenu = (event) => {
    event.preventDefault();
    onContextMenu?.(event, folder);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);

    const fileId = event.dataTransfer.getData("application/x-file-id");
    if (!fileId) {
      return;
    }
    onDropFile?.(fileId, folder);
  };

  return (
    <div
      className={
        dragOver ? "folder-item folder-item--drag-over" : "folder-item"
      }
      onContextMenu={handleContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
