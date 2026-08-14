import { useEffect, useState } from "react";

import folderService from "../../services/folderService";

import "./FolderPicker.css";

export default function FolderPicker({ value = null, onChange }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const response = await folderService.getFolders();
      setFolders(response?.data || response || []);
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách thư mục.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="folder-picker">Đang tải thư mục...</div>;
  }

  if (error) {
    return <div className="folder-picker folder-picker--error">{error}</div>;
  }

  return (
    <div className="folder-picker">
      <select
        className="input"
        value={value || ""}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Thư mục gốc</option>

        {folders.map((folder) => (
          <option key={folder._id} value={folder._id}>
            {folder.name}
          </option>
        ))}
      </select>
    </div>
  );
}
