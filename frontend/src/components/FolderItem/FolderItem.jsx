import "./FolderItem.css";

export default function FolderItem({ folder, onOpen, onCopy, onShare }) {
  return (
    <div className="folder-item">
      <div className="folder-main" onDoubleClick={() => onOpen?.(folder)}>
        <div className="folder-icon">📁</div>

        <div className="folder-name">{folder.name}</div>
      </div>

      <div className="folder-actions">
        <button onClick={() => onCopy?.(folder)} title="Sao chép">
          📋
        </button>
        <button onClick={() => onShare?.(folder)} title="Chia sẻ">
          🔗
        </button>
      </div>
    </div>
  );
}
