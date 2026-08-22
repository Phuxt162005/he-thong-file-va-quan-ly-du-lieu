import { useEffect, useState } from "react";

import folderService from "../../services/folderService";

import "./FolderPicker.css";

function FolderNode({
  folder,
  selectedId,
  onSelect,
  expanded,
  onToggle,
  disabledIds,
}) {
  const isExpanded = expanded.has(folder._id);
  const isDisabled = disabledIds?.has(folder._id);

  return (
    <div className="folder-node">
      <div
        className={`folder-node__row ${
          selectedId === folder._id ? "folder-node__row--selected" : ""
        } ${isDisabled ? "folder-node__row--disabled" : ""}`}
      >
        <button
          type="button"
          className="folder-node__toggle"
          onClick={() => onToggle(folder)}
          disabled={isDisabled}
        >
          {isExpanded ? "▾" : "▸"}
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
        folder.children?.map((child) => (
          <div className="folder-node__children" key={child._id}>
            <FolderNode
              folder={child}
              selectedId={selectedId}
              onSelect={onSelect}
              expanded={expanded}
              onToggle={onToggle}
              disabledIds={disabledIds}
            />
          </div>
        ))}
    </div>
  );
}

export default function FolderPicker({
  value = null,
  onChange,
  disabledIds = [],
}) {
  const [folders, setFolders] = useState([]);
  const [expanded, setExpanded] = useState(new Set());
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
      const rootFolders = response?.data || response || [];
      setFolders(rootFolders.map((folder) => ({ ...folder, children: [] })));
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách thư mục.");
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async (folder) => {
    try {
      const response = await folderService.getChildren(folder._id);
      const children = response?.data || response || [];
      return children.map((child) => ({ ...child, children: [] }));
    } catch (err) {
      setError(err?.message || "Không thể tải thư mục con.");
      return [];
    }
  };

  const handleToggle = async (folder) => {
    if (disabledSet.has(folder._id)) {
      return;
    }

    const nextExpanded = new Set(expanded);
    if (nextExpanded.has(folder._id)) {
      nextExpanded.delete(folder._id);
      setExpanded(nextExpanded);
      return;
    }

    // Chưa tải children
    if (!folder.children || folder.children.length === 0) {
      const children = await loadChildren(folder);
      folder.children = children;
      setFolders([...folders]);
    }
    nextExpanded.add(folder._id);
    setExpanded(nextExpanded);
  };

  if (loading) {
    return <div className="folder-picker">Đang tải thư mục...</div>;
  }

  if (error) {
    return <div className="folder-picker folder-picker--error">{error}</div>;
  }

  return (
    <div className="folder-picker">
      <button
        type="button"
        className={`folder-picker__root ${
          value === null ? "folder-picker__root--selected" : ""
        }`}
        onClick={() => onChange(null)}
      >
        🏠 Thư mục gốc
      </button>

      <div className="folder-picker__tree">
        {folders.map((folder) => (
          <FolderNode
            key={folder._id}
            folder={folder}
            selectedId={value}
            onSelect={onChange}
            expanded={expanded}
            onToggle={handleToggle}
            disabledIds={disabledSet}
          />
        ))}
      </div>
    </div>
  );
}
