import "./FolderItem.css";

export default function FolderItem({ folder, onOpen }) {
  return (
    <div className="folder-item" onDoubleClick={() => onOpen(folder)}>
      <div className="folder-icon">📁</div>

      <div className="folder-name">{folder.name}</div>
    </div>
  );
}
