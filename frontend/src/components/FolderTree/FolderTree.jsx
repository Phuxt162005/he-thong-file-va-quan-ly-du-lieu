import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import folderService from "../../services/folderService";
import fileService from "../../services/fileService";

import "./FolderTree.css";

export default function FolderTree({
  selectedFolderId,
  onSelect,
  onDropFile,
  onDropFolder,
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
            onDropFile={onDropFile}
            onDropFolder={onDropFolder}
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
  onDropFile,
  onDropFolder,
  expandedIds,
  childrenMap,
  filesMap,
  onToggle,
}) {
  const navigate = useNavigate();
  const folderId = String(folder._id);
  const files = filesMap?.[folderId] || [];
  const expanded = expandedIds.has(folderId);
  const children = childrenMap[folderId] || [];

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    event.currentTarget.classList.add("folder-tree__item--drag-over");
  };

  const handleDragLeave = (event) => {
    event.currentTarget.classList.remove("folder-tree__item--drag-over");
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove("folder-tree__item--drag-over");

    const fileId = event.dataTransfer.getData("application/x-file-id");
    const folderId = event.dataTransfer.getData("application/x-folder-id");
    if (fileId) {
      onDropFile?.(fileId, folder);
      return;
    }
    if (folderId) {
      if (String(folderId) === String(folder._id)) {
        return;
      }
      onDropFolder?.(folderId, folder);
    }
  };

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
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
              onDropFile={onDropFile}
              onDropFolder={onDropFolder}
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
              title={`Mở ${file.name}`}
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/files?preview=${file._id}`);
              }}
            >
              <span className="folder-tree__file-icon" aria-hidden="true">
                <FileTypeIcon file={file} />
              </span>

              <span className="folder-tree__file-name">{file.name}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function FileTypeIcon({ file }) {
  const extension = getExtension(file?.name);

  const config = {
    pdf: ["#ef476f", "PDF"],

    doc: ["#2f80ed", "W"],
    docx: ["#2f80ed", "W"],

    xls: ["#25a66a", "X"],
    xlsx: ["#25a66a", "X"],
    csv: ["#25a66a", "X"],

    ppt: ["#f05a24", "P"],
    pptx: ["#f05a24", "P"],

    png: ["#35b98b", "IMG"],
    jpg: ["#35b98b", "IMG"],
    jpeg: ["#35b98b", "IMG"],
    gif: ["#35b98b", "IMG"],
    webp: ["#35b98b", "IMG"],

    zip: ["#9347e8", "ZIP"],
    rar: ["#9347e8", "ZIP"],
    "7z": ["#9347e8", "ZIP"],

    txt: ["#7f9abb", "TXT"],
    md: ["#7f9abb", "MD"],

    py: ["#4d82c3", "PY"],
    js: ["#d6a928", "JS"],
    jsx: ["#3aa6c8", "JS"],
    ts: ["#3478c8", "TS"],
    tsx: ["#3478c8", "TS"],
    html: ["#e56a3a", "HTML"],
    css: ["#4b83c4", "CSS"],
    json: ["#b59a2a", "JSON"],
    ipynb: ["#c96b2c", "PY"],
  }[extension] || [
    "#7f9abb",
    extension ? extension.slice(0, 4).toUpperCase() : "FILE",
  ];

  return (
    <svg
      viewBox="0 0 42 48"
      className="folder-tree__file-type-icon"
      aria-hidden="true"
    >
      <path d="M7 2h19l9 9v33H7z" fill={config[0]} />

      <path d="M26 2v10h9" fill="#fff" opacity=".45" />

      <text
        x="21"
        y="31"
        textAnchor="middle"
        fill="#fff"
        fontSize={config[1].length > 4 ? "5.5" : "9"}
        fontWeight="700"
        fontFamily="Arial,sans-serif"
      >
        {config[1]}
      </text>
    </svg>
  );
}

function getExtension(name = "") {
  const parts = name.toLowerCase().split(".");

  return parts.length > 1 ? parts.pop() : "";
}
