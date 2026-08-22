import { useEffect, useState } from "react";

import folderService from "../../services/folderService";

import "./FolderPicker.css";

function FolderNode({
  folder,
  level,
  selectedId,
  onSelect,
  expandedIds,
  childrenMap,
  loadingIds,
  onToggle,
  disabledIds,
}) {
  const isExpanded = expandedIds.has(folder._id);
  const isLoading = loadingIds.has(folder._id);
  const children = childrenMap[folder._id] || [];
  const isDisabled = disabledIds.has(folder._id);

  return (
    <div className="folder-node">
      <div
        className={`folder-node__row ${
          selectedId === folder._id ? "folder-node__row--selected" : ""
        } ${isDisabled ? "folder-node__row--disabled" : ""}`}
        style={{ paddingLeft: `${level * 20}px` }}
      >
        <button
          type="button"
          className="folder-node__toggle"
          onClick={() => onToggle(folder)}
          disabled={isDisabled || isLoading}
        >
          {isLoading ? "..." : isExpanded ? "▾" : "▸"}
        </button>

        <button
          type="button"
          className="folder-node__name"
          onClick={() => {
            if (!isDisabled) {
              onSelect(folder._id);
            }
          }}
          disabled={isDisabled}
        >
          📁 {folder.name}
        </button>
      </div>

      {isExpanded &&
        children.map((child) => (
          <FolderNode
            key={child._id}
            folder={child}
            level={level + 1}
            selectedId={selectedId}
            onSelect={onSelect}
            expandedIds={expandedIds}
            childrenMap={childrenMap}
            loadingIds={loadingIds}
            onToggle={onToggle}
            disabledIds={disabledIds}
          />
        ))}
    </div>
  );
}

export default function FolderPicker({
  value = null,
  onChange,
  disabledIds = [],
}) {
  const [rootFolders, setRootFolders] = useState([]);
  const [childrenMap, setChildrenMap] = useState({});
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [loadingIds, setLoadingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const disabledSet = new Set(disabledIds);

  useEffect(() => {
    loadRootFolders();
  }, []);

  const loadRootFolders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await folderService.getFolders();
      const folders = response?.data || response || [];
      setRootFolders(folders);
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách thư mục.");
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async (folderId) => {
    try {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.add(folderId);
        return next;
      });

      const response = await folderService.getFolders(folderId);
      const children = response?.data || response || [];
      setChildrenMap((prev) => ({ ...prev, [folderId]: children }));
    } catch (err) {
      setError(err?.message || "Không thể tải thư mục con.");
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(folderId);
        return next;
      });
    }
  };

  const handleToggle = async (folder) => {
    const folderId = folder._id;
    if (disabledSet.has(folderId)) {
      return;
    }

    const isExpanded = expandedIds.has(folderId);
    if (isExpanded) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(folderId);
        return next;
      });
      return;
    }

    // Nếu chưa tải children thì tải
    if (childrenMap[folderId] === undefined) {
      await loadChildren(folderId);
    }
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(folderId);
      return next;
    });
  };

  if (loading) {
    return <div className="folder-picker">Đang tải thư mục...</div>;
  }

  if (error) {
    return <div className="folder-picker folder-picker--error">{error}</div>;
  }

  return (
    <div className="folder-picker">
      {/* Root */}
      <button
        type="button"
        className={`folder-picker__root ${value === null ? "folder-picker__root--selected" : ""}`}
        onClick={() => onChange(null)}
      >
        🏠 Thư mục gốc
      </button>

      {/* Tree */}
      <div className="folder-picker__tree">
        {rootFolders.map((folder) => (
          <FolderNode
            key={folder._id}
            folder={folder}
            level={0}
            selectedId={value}
            onSelect={onChange}
            expandedIds={expandedIds}
            childrenMap={childrenMap}
            loadingIds={loadingIds}
            onToggle={handleToggle}
            disabledIds={disabledSet}
          />
        ))}
      </div>
    </div>
  );
}
