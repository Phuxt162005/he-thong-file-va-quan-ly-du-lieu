import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import folderService from "../../services/folderService";
import fileService from "../../services/fileService";

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
  const [filesMap, setFilesMap] = useState({});
  const [loadingIds, setLoadingIds] = useState(new Set());

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
    const id = String(folderId);

    setLoadingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      const [folderResponse, fileResponse] = await Promise.all([
        folderService.getFolders(folderId),
        fileService.getFiles(folderId),
      ]);
      const childFolders = folderResponse?.data || folderResponse || [];
      const childFiles =
        fileResponse?.files || fileResponse?.data || fileResponse || [];

      setChildrenMap((prev) => ({
        ...prev,
        [id]: Array.isArray(childFolders) ? childFolders : [],
      }));
      setFilesMap((prev) => ({
        ...prev,
        [id]: Array.isArray(childFiles) ? childFiles : [],
      }));
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
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
      if (childrenMap[id] === undefined || filesMap[id] === undefined) {
        await loadChildren(folderId);
      }
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    } catch (err) {
      setError(err?.message || "Không thể tải nội dung thư mục.");
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
            filesMap={filesMap}
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
  filesMap,
  onToggle,
}) {
  const folderId = String(folder._id);
  const files = filesMap?.[folderId] || [];
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
          aria-label={expanded ? "Thu gọn thư mục" : "Mở rộng thư mục"}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d={expanded ? "m6 9 6 6 6-6" : "m9 6 6 6-6 6"}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <span className="folder-tree__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z"
              fill="currentColor"
            />
          </svg>
        </span>

        <span className="folder-tree__name">{folder.name}</span>
      </div>

      {expanded && (
        <>
          {children.map((child) => (
            <FolderTreeItem
              key={child._id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              childrenMap={childrenMap}
              filesMap={filesMap}
              onToggle={onToggle}
            />
          ))}

          {files.map((file) => (
            <div
              key={file._id}
              className="folder-tree__file"
              style={{
                paddingLeft: `${(level + 1) * 18 + 24}px`,
              }}
              title={file.name}
            >
              <span>📄</span>
              <span>{file.name}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
