import { useEffect, useState } from "react";

import folderService from "../../services/folder.service";

import "./FolderTree.css";

export default function FolderTree({ selectedFolderId, onSelect }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRootFolders();
  }, []);

  const loadRootFolders = async () => {
    try {
      setLoading(true);
      const response = await folderService.getFolders();
      setFolders(response?.data || response || []);
    } catch (err) {
      setError(err?.message || "Không thể tải thư mục.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="folder-tree__loading">Đang tải...</div>;
  }

  if (error) {
    return <div className="folder-tree__error">{error}</div>;
  }

  return (
    <div className="folder-tree">
      {folders.map((folder) => (
        <FolderTreeItem
          key={folder._id}
          folder={folder}
          selectedFolderId={selectedFolderId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function FolderTreeItem({ folder, selectedFolderId, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // load folder con
  const loadChildren = async () => {
    try {
      setLoading(true);
      const response = await folderService.getFolders(folder._id);
      setChildren(response?.data || response || []);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (event) => {
    event.stopPropagation();

    if (!expanded && !loaded) {
      await loadChildren();
    }
    setExpanded(!expanded);
  };

  return (
    <div className="folder-tree__node">
      <div
        className={
          selectedFolderId === folder._id
            ? "folder-tree__item folder-tree__item--selected"
            : "folder-tree__item"
        }
        onClick={() => onSelect(folder)}
      >
        <button className="folder-tree__expand" onClick={handleExpand}>
          {expanded ? "▼" : "▶"}
        </button>

        <span className="folder-tree__icon">📁</span>
        <span className="folder-tree__name">{folder.name}</span>
      </div>

      {expanded && (
        <div className="folder-tree__children">
          {loading && <div className="folder-tree__loading">Đang tải...</div>}

          {!loading &&
            children.map((child) => (
              <FolderTreeItem
                key={child._id}
                folder={child}
                selectedFolderId={selectedFolderId}
                onSelect={onSelect}
              />
            ))}
        </div>
      )}
    </div>
  );
}
