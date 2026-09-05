import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import folderService from "../../services/folderService";

import "./FolderTree.css";

export default function FolderTree({
  selectedFolderId,
  onSelect,
  refreshKey = 0,
}) {
  const [folders, setFolders] = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [childrenMap, setChildrenMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRootFolders();
  }, [refreshKey]);

  async function loadRootFolders() {
    try {
      setLoading(true);
      setError("");

      const response = await folderService.getFolders();
      const data = response?.data || response || [];

      setFolders(Array.isArray(data) ? data : []);
      setChildrenMap({});
      setExpandedIds(new Set());
    } catch (err) {
      setError(err?.message || "Không thể tải thư mục.");
    } finally {
      setLoading(false);
    }
  }

  async function loadChildren(folderId) {
    const response = await folderService.getFolders(folderId);
    const data = response?.data || response || [];

    setChildrenMap((prev) => ({
      ...prev,
      [folderId]: Array.isArray(data) ? data : [],
    }));
  }

  async function handleToggle(folderId) {
    const id = String(folderId);
    if (expandedIds.has(id)) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }

    try {
      if (childrenMap[id] === undefined) {
        await loadChildren(folderId);
      }

      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    } catch (err) {
      setError(err?.message || "Không thể tải thư mục con.");
    }
  }

  if (loading) {
    return <div className="folder-tree__loading">Đang tải thư mục...</div>;
  }

  if (error) {
    return <div className="folder-tree__error">{error}</div>;
  }

  return (
    <div className="folder-tree">
      {folders.length === 0 ? (
        <div className="folder-tree__empty">Chưa có thư mục.</div>
      ) : (
        folders.map((folder) => (
          <FolderTreeItem
            key={folder._id}
            folder={folder}
            level={0}
            selectedFolderId={selectedFolderId}
            onSelect={onSelect}
            expandedIds={expandedIds}
            childrenMap={childrenMap}
            onToggle={handleToggle}
          />
        ))
      )}
    </div>
  );
}

function FolderTreeItem({
  folder,
  level,
  selectedFolderId,
  onSelect,
  expandedIds,
  childrenMap,
  onToggle,
}) {
  const folderId = String(folder._id);
  const expanded = expandedIds.has(folderId);
  const children = childrenMap[folderId] || [];

  return (
    <div className="folder-tree__node">
      <div
        className={`folder-tree__item ${
          String(selectedFolderId) === folderId
            ? "folder-tree__item--selected"
            : ""
        }`}
        style={{
          paddingLeft: `${level * 18}px`,
        }}
        onClick={() => onSelect?.(folder)}
      >
        <button
          type="button"
          className="folder-tree__expand"
          onClick={(event) => {
            event.stopPropagation();
            onToggle(folder._id);
          }}
        >
          {expanded ? "▼" : "▶"}
        </button>

        <span className="folder-tree__icon">📁</span>

        <span className="folder-tree__name">{folder.name}</span>
      </div>

      {expanded &&
        children.map((child) => (
          <FolderTreeItem
            key={child._id}
            folder={child}
            level={level + 1}
            selectedFolderId={selectedFolderId}
            onSelect={onSelect}
            expandedIds={expandedIds}
            childrenMap={childrenMap}
            onToggle={onToggle}
          />
        ))}
    </div>
  );
}
