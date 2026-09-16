import { useEffect, useMemo, useState } from "react";

import Loading from "../../components/Loading/Loading";
import Modal from "../../components/Modal/Modal";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import FormInput from "../../components/FormInput/FormInput";

import shareService from "../../services/shareService";

import "./Shares.css";

export default function Shares() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedShare, setSelectedShare] = useState(null);
  const [selectedShares, setSelectedShares] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [revokeModal, setRevokeModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    visibility: "public",
    accessType: "download",
    expiresAt: "",
    password: "",
    maxDownloads: "",
    removePassword: false,
  });

  useEffect(() => {
    loadShares();
  }, []);

  const loadShares = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await shareService.getShares();
      const allShares = response?.data || response || [];

      setShares(Array.isArray(allShares) ? allShares : []);
      setSelectedShares([]);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể tải danh sách Share Link.",
      );
    } finally {
      setLoading(false);
    }
  };

  const visibleShares = useMemo(() => {
    let result = [...shares];

    if (typeFilter !== "all") {
      result = result.filter((share) => {
        const type = String(
          share.resourceType || share.type || "",
        ).toLowerCase();

        return type === typeFilter;
      });
    }

    const getSortValue = (share) => {
      switch (sortColumn) {
        case "name":
          return String(
            share.resourceName || share.name || "Tài nguyên",
          ).toLowerCase();
        case "sharedBy":
          return String(
            share.ownerName ||
              share.ownerUsername ||
              share.ownerEmail ||
              "Người dùng",
          ).toLowerCase();
        case "access":
          return String(share.accessType || "").toLowerCase();
        case "createdAt":
        default:
          return new Date(
            share.createdAt || share.sharedAt || share.updatedAt || 0,
          ).getTime();
      }
    };

    result.sort((a, b) => {
      const valueA = getSortValue(a);
      const valueB = getSortValue(b);

      let comparison = 0;

      if (typeof valueA === "number" && typeof valueB === "number") {
        comparison = valueA - valueB;
      } else {
        comparison = String(valueA).localeCompare(String(valueB), "vi", {
          numeric: true,
          sensitivity: "base",
        });
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return result;
  }, [shares, typeFilter, sortColumn, sortDirection]);

  const handleColumnSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortColumn(column);
    setSortDirection(column === "createdAt" ? "desc" : "asc");
  };

  const allVisibleSelected =
    visibleShares.length > 0 &&
    visibleShares.every((share) => selectedShares.includes(share._id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedShares((prev) =>
        prev.filter((id) => !visibleShares.some((share) => share._id === id)),
      );

      return;
    }

    setSelectedShares((prev) => [
      ...new Set([...prev, ...visibleShares.map((share) => share._id)]),
    ]);
  };

  const toggleSelect = (id) => {
    setSelectedShares((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const openEdit = (share) => {
    setSelectedShare(share);

    setFormData({
      visibility: share.visibility || "public",
      accessType: share.accessType || "download",
      expiresAt: formatDateTime(share.expiresAt),
      password: "",
      maxDownloads: share.maxDownloads ?? "",
      removePassword: false,
    });

    setEditModal(true);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUpdate = async () => {
    if (!selectedShare) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (formData.maxDownloads !== "" && Number(formData.maxDownloads) < 1) {
        setError("Giới hạn Download phải lớn hơn 0.");
        return;
      }

      const data = {};

      if (formData.expiresAt !== formatDateTime(selectedShare.expiresAt)) {
        data.expiresAt = formData.expiresAt || null;
      }
      if (formData.maxDownloads !== String(selectedShare.maxDownloads ?? "")) {
        data.maxDownloads =
          formData.maxDownloads === "" ? null : Number(formData.maxDownloads);
      }
      if (formData.removePassword) {
        data.password = "";
      } else if (formData.password) {
        data.password = formData.password;
      }
      if (formData.visibility !== (selectedShare.visibility || "public")) {
        data.visibility = formData.visibility;
      }
      if (formData.accessType !== (selectedShare.accessType || "download")) {
        data.accessType = formData.accessType;
      }

      const response = await shareService.updateShare(selectedShare._id, data);
      const updated = response?.data || response;

      setShares((prev) =>
        prev.map((share) =>
          share._id === selectedShare._id ? { ...share, ...updated } : share,
        ),
      );

      setEditModal(false);
      setSelectedShare(null);
    } catch (err) {
      setError(err?.message || "Không thể cập nhật Share Link.");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedShare) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await shareService.revokeShare(selectedShare._id);

      setShares((prev) =>
        prev.map((share) =>
          share._id === selectedShare._id
            ? { ...share, isActive: false }
            : share,
        ),
      );

      setRevokeModal(false);
      setSelectedShare(null);
    } catch (err) {
      setError(err?.message || "Không thể thu hồi Share Link.");
    } finally {
      setSaving(false);
    }
  };

  const copyShareLink = async (share) => {
    const url =
      share?.url ||
      share?.shareUrl ||
      (share?.token ? `${window.location.origin}/share/${share.token}` : "");

    if (!url) {
      setError("Không tìm thấy URL của Share Link.");
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setError("");
    } catch {
      setError("Không thể sao chép Share Link.");
    }
  };

  if (loading) {
    return <Loading message="Đang tải Share Link..." />;
  }

  return (
    <>
      <div className="shares-page">
        {/* =================================================
            HEADER
            ================================================= */}
        <div className="shares-page__header">
          <div>
            <h1>Được chia sẻ</h1>

            <p>Các file và thư mục được người khác chia sẻ với bạn</p>
          </div>

          <div className="shares-page__sort">
            <button
              type="button"
              className="shares-page__sort-button"
              onClick={() => setSortOpen((prev) => !prev)}
              aria-expanded={sortOpen}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M8 5v14M8 5l-3 3m3-3 3 3M16 19V5m0 14 3-3m-3 3-3-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span>{sortOrder === "newest" ? "Mới nhất" : "Cũ nhất"}</span>

              <svg
                className={`shares-page__sort-chevron ${
                  sortOpen ? "shares-page__sort-chevron--open" : ""
                }`}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="m6 9 6 6 6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {sortOpen && (
              <div className="shares-page__sort-menu">
                <button
                  type="button"
                  className={
                    sortOrder === "newest"
                      ? "shares-page__sort-option shares-page__sort-option--active"
                      : "shares-page__sort-option"
                  }
                  onClick={() => {
                    setSortOrder("newest");
                    setSortOpen(false);
                  }}
                >
                  Mới nhất
                </button>

                <button
                  type="button"
                  className={
                    sortOrder === "oldest"
                      ? "shares-page__sort-option shares-page__sort-option--active"
                      : "shares-page__sort-option"
                  }
                  onClick={() => {
                    setSortOrder("oldest");
                    setSortOpen(false);
                  }}
                >
                  Cũ nhất
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* =================================================
            FILTER TABS
            ================================================= */}
        <div className="shares-page__tabs">
          <button
            type="button"
            className={`shares-page__tab ${
              typeFilter === "all" ? "shares-page__tab--active" : ""
            }`}
            onClick={() => setTypeFilter("all")}
          >
            <UsersIcon />

            <span>Tất cả</span>
          </button>

          <button
            type="button"
            className={`shares-page__tab ${
              typeFilter === "file" ? "shares-page__tab--active" : ""
            }`}
            onClick={() => setTypeFilter("file")}
          >
            <FileIcon />

            <span>File</span>
          </button>

          <button
            type="button"
            className={`shares-page__tab ${
              typeFilter === "folder" ? "shares-page__tab--active" : ""
            }`}
            onClick={() => setTypeFilter("folder")}
          >
            <FolderIcon />

            <span>Thư mục</span>
          </button>
        </div>

        {/* =================================================
            LIST
            ================================================= */}
        <div className="shares-list">
          <div className="shares-list__header">
            <div className="shares-list__checkbox">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAll}
                aria-label="Chọn tất cả"
              />
            </div>

            <div>
              <button
                type="button"
                className="shares-list__sort-button"
                onClick={() => handleColumnSort("name")}
              >
                <span>Tên</span>

                <SortIcon
                  active={sortColumn === "name"}
                  direction={sortColumn === "name" ? sortDirection : null}
                />
              </button>
            </div>

            <div>
              <button
                type="button"
                className="shares-list__sort-button"
                onClick={() => handleColumnSort("sharedBy")}
              >
                <span>Chia sẻ bởi</span>

                <SortIcon
                  active={sortColumn === "sharedBy"}
                  direction={sortColumn === "sharedBy" ? sortDirection : null}
                />
              </button>
            </div>

            <div>
              <button
                type="button"
                className="shares-list__sort-button"
                onClick={() => handleColumnSort("access")}
              >
                <span>Quyền truy cập</span>

                <SortIcon
                  active={sortColumn === "access"}
                  direction={sortColumn === "access" ? sortDirection : null}
                />
              </button>
            </div>

            <div>
              <button
                type="button"
                className="shares-list__sort-button"
                onClick={() => handleColumnSort("createdAt")}
              >
                <span>Thời gian</span>

                <SortIcon
                  active={sortColumn === "createdAt"}
                  direction={sortColumn === "createdAt" ? sortDirection : null}
                />
              </button>
            </div>
          </div>

          {visibleShares.length === 0 ? (
            <div className="shares-list__empty">
              Không có tài nguyên được chia sẻ.
            </div>
          ) : (
            visibleShares.map((share) => (
              <ShareItem
                key={share._id}
                share={share}
                selected={selectedShares.includes(share._id)}
                onSelect={() => toggleSelect(share._id)}
                onEdit={openEdit}
                onRevoke={(item) => {
                  setSelectedShare(item);
                  setRevokeModal(true);
                }}
                onCopy={copyShareLink}
              />
            ))
          )}

          {/* =================================================
              FOOTER
              ================================================= */}
          <div className="shares-page__footer">
            <span>
              Hiển thị 1 - {visibleShares.length} của {visibleShares.length} mục
            </span>

            <div className="shares-page__pagination">
              <button type="button" disabled aria-label="Trang trước">
                ‹
              </button>

              <button type="button" className="shares-page__pagination--active">
                1
              </button>

              <button type="button" disabled aria-label="Trang sau">
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          EDIT MODAL
          ================================================= */}
      <Modal
        isOpen={editModal}
        title="Chỉnh sửa Share Link"
        onClose={() => {
          if (!saving) {
            setEditModal(false);
            setSelectedShare(null);
          }
        }}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setEditModal(false);
                setSelectedShare(null);
              }}
              disabled={saving}
            >
              Hủy
            </button>

            <button
              className="btn btn-primary"
              onClick={handleUpdate}
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </>
        }
      >
        <div className="share-edit-form__group">
          <label htmlFor="edit-visibility">Phạm vi truy cập</label>

          <select
            id="edit-visibility"
            name="visibility"
            className="input"
            value={formData.visibility}
            onChange={handleChange}
            disabled={saving}
          >
            <option value="public">Public - Công khai</option>

            <option value="private">Private - Riêng tư</option>
          </select>
        </div>

        <div className="share-edit-form__group">
          <label htmlFor="edit-accessType">Quyền truy cập</label>

          <select
            id="edit-accessType"
            name="accessType"
            className="input"
            value={formData.accessType}
            onChange={handleChange}
            disabled={saving}
          >
            <option value="download">Cho phép xem và Download</option>

            <option value="view">View Only - Chỉ xem</option>
          </select>
        </div>

        <div className="share-edit-form">
          <FormInput
            label="Ngày hết hạn"
            name="expiresAt"
            type="datetime-local"
            value={formData.expiresAt}
            onChange={handleChange}
            disabled={saving}
          />

          <FormInput
            label="Mật khẩu mới"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Để trống nếu giữ nguyên"
            disabled={saving}
          />

          <div className="share-edit-form__group">
            <label className="share-edit-form__checkbox">
              <input
                type="checkbox"
                name="removePassword"
                checked={formData.removePassword}
                onChange={handleChange}
                disabled={saving}
              />

              <span>Xóa mật khẩu hiện tại</span>
            </label>
          </div>

          <FormInput
            label="Giới hạn Download"
            name="maxDownloads"
            type="number"
            value={formData.maxDownloads}
            onChange={handleChange}
            disabled={saving}
          />
        </div>
      </Modal>

      {/* =================================================
          REVOKE MODAL
          ================================================= */}

      <ConfirmDialog
        isOpen={revokeModal}
        title="Thu hồi Share Link"
        message={`Bạn có chắc muốn thu hồi Share Link của "${
          selectedShare?.resourceName || selectedShare?.name || ""
        }"?`}
        confirmText="Thu hồi"
        cancelText="Hủy"
        danger
        loading={saving}
        onConfirm={handleRevoke}
        onCancel={() => {
          if (!saving) {
            setRevokeModal(false);
            setSelectedShare(null);
          }
        }}
      />
    </>
  );
}

/* =========================================================
   SHARE ITEM
   ========================================================= */
function ShareItem({ share, selected, onSelect, onEdit, onRevoke, onCopy }) {
  const status = getStatus(share);
  const isFolder =
    String(share.resourceType || share.type || "").toLowerCase() === "folder";

  return (
    <div className="share-item">
      {/* CHECKBOX */}
      <div className="share-item__checkbox">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          aria-label={`Chọn ${
            share.resourceName || share.name || "tài nguyên"
          }`}
        />
      </div>

      {/* RESOURCE */}
      <div className="share-item__resource">
        <span
          className={`share-item__icon ${
            isFolder ? "share-item__icon--folder" : ""
          }`}
          aria-hidden="true"
        >
          {isFolder ? <FolderIcon /> : <ResourceFileIcon share={share} />}
        </span>

        <div className="share-item__resource-info">
          <strong title={share.resourceName || share.name || "Tài nguyên"}>
            {share.resourceName || share.name || "Tài nguyên"}
          </strong>

          <span>
            {isFolder
              ? `Thư mục${
                  share.itemCount != null ? ` • ${share.itemCount} mục` : ""
                }`
              : getFileMeta(share)}
          </span>
        </div>
      </div>

      {/* SHARED BY */}
      <div className="share-item__shared-by">
        <span className="share-item__avatar">
          {getInitials(getSharerName(share))}
        </span>

        <div>
          <strong>{getSharerName(share)}</strong>

          <span>{getSharerEmail(share)}</span>
        </div>
      </div>

      {/* ACCESS */}
      <div className="share-item__access">
        <span
          className={`share-access ${
            share.accessType === "view"
              ? "share-access--view"
              : "share-access--download"
          }`}
        >
          <EyeIcon />

          <span>
            {share.accessType === "view" ? "Chỉ xem" : "Xem & Tải xuống"}
          </span>
        </span>
      </div>

      {/* TIME */}
      <div className="share-item__time">
        {formatDisplayDate(
          share.createdAt ||
            share.sharedAt ||
            share.updatedAt ||
            share.expiresAt,
        )}
      </div>

      {/* ACTIONS */}
      <div className="share-item__actions">
        <button
          type="button"
          className="share-item__download"
          onClick={() => onCopy(share)}
          title="Tải xuống / Sao chép liên kết"
        >
          <DownloadIcon />
        </button>

        <button
          type="button"
          className="share-item__more"
          onClick={() => onEdit(share)}
          disabled={status === "revoked"}
          title="Thao tác khác"
        >
          <MoreIcon />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   ICONS
   ========================================================= */
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <circle
        cx="9"
        cy="7"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 2h8l5 5v15H6z" fill="currentColor" opacity=".95" />

      <path d="M14 2v5h5" fill="none" stroke="#fff" strokeWidth="1.5" />

      <path
        d="M9 12h6M9 16h6"
        fill="none"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function ResourceFileIcon({ share }) {
  const fileName = String(share?.resourceName || share?.name || "");
  const mimeType = String(
    share?.mimeType || share?.fileType || "",
  ).toLowerCase();
  const extension = getExtension(fileName);
  const type = `${mimeType} ${extension}`.toLowerCase();

  if (type.includes("pdf") || extension === "pdf") {
    return (
      <span className="resource-file-icon resource-file-icon--pdf">PDF</span>
    );
  }
  if (
    type.includes("png") ||
    type.includes("jpg") ||
    type.includes("jpeg") ||
    type.includes("gif") ||
    type.includes("webp") ||
    type.includes("image/")
  ) {
    return (
      <span className="resource-file-icon resource-file-icon--image">IMG</span>
    );
  }
  if (
    type.includes("word") ||
    type.includes("msword") ||
    type.includes("officedocument.word") ||
    extension === "doc" ||
    extension === "docx"
  ) {
    return (
      <span className="resource-file-icon resource-file-icon--word">W</span>
    );
  }
  if (
    type.includes("excel") ||
    type.includes("spreadsheet") ||
    extension === "xls" ||
    extension === "xlsx" ||
    extension === "csv"
  ) {
    return (
      <span className="resource-file-icon resource-file-icon--excel">X</span>
    );
  }
  if (
    type.includes("powerpoint") ||
    type.includes("presentation") ||
    extension === "ppt" ||
    extension === "pptx"
  ) {
    return (
      <span className="resource-file-icon resource-file-icon--powerpoint">
        P
      </span>
    );
  }
  if (
    type.includes("zip") ||
    type.includes("rar") ||
    type.includes("7z") ||
    extension === "zip" ||
    extension === "rar" ||
    extension === "7z"
  ) {
    return (
      <span className="resource-file-icon resource-file-icon--archive">
        ZIP
      </span>
    );
  }

  return (
    <span className="resource-file-icon resource-file-icon--file">
      {extension ? extension.slice(0, 4).toUpperCase() : "FILE"}
    </span>
  );
}

function SortIcon({ active = false, direction = null }) {
  return (
    <span
      className={`shares-sort-icon ${active ? "shares-sort-icon--active" : ""}`}
      aria-hidden="true"
    >
      {direction === "asc" ? "↑" : direction === "desc" ? "↓" : "↕"}
    </span>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />

      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="19" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */
function getStatus(share) {
  if (share.isActive === false) {
    return "revoked";
  }

  if (share.expiresAt && new Date(share.expiresAt) <= new Date()) {
    return "expired";
  }

  if (
    share.maxDownloads !== null &&
    share.maxDownloads !== undefined &&
    share.downloadCount >= share.maxDownloads
  ) {
    return "expired";
  }

  return "active";
}

function getSharerName(share) {
  return (
    share?.sharedBy?.name ||
    share?.sharedBy?.fullName ||
    share?.owner?.name ||
    share?.owner?.fullName ||
    share?.user?.name ||
    share?.user?.fullName ||
    share?.createdBy?.name ||
    share?.createdBy?.fullName ||
    "Người dùng"
  );
}

function getSharerEmail(share) {
  return (
    share?.sharedBy?.email ||
    share?.owner?.email ||
    share?.user?.email ||
    share?.createdBy?.email ||
    "Không có email"
  );
}

function getInitials(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "?";
  }
  if (words.length === 1) {
    return words[0].slice(0, 1).toUpperCase();
  }
  return (
    words[0].slice(0, 1) + words[words.length - 1].slice(0, 1)
  ).toUpperCase();
}

function getFileMeta(share) {
  const fileName = String(share?.resourceName || share?.name || "").trim();

  const mimeType = String(share?.mimeType || share?.fileType || "")
    .trim()
    .toLowerCase();

  const extension = getFriendlyExtension(fileName, mimeType);

  const size = share?.size ?? share?.fileSize ?? share?.resourceSize ?? null;

  if (extension && size !== null) {
    return `${extension} • ${formatFileSize(size)}`;
  }

  if (extension) {
    return extension;
  }

  if (size !== null) {
    return formatFileSize(size);
  }

  return "File";
}

function getFriendlyExtension(fileName, mimeType) {
  /*
   * Ưu tiên MIME type vì nó là thông tin chính xác
   * được lưu trong File model.
   */
  if (mimeType === "application/pdf") {
    return "PDF";
  }
  if (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.ms-word"
  ) {
    return "DOC";
  }
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "DOCX";
  }
  if (mimeType === "application/vnd.ms-excel") {
    return "XLS";
  }
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "XLSX";
  }
  if (mimeType === "text/csv") {
    return "CSV";
  }
  if (mimeType === "application/vnd.ms-powerpoint") {
    return "PPT";
  }
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return "PPTX";
  }
  if (mimeType === "application/zip") {
    return "ZIP";
  }
  if (
    mimeType === "application/x-rar-compressed" ||
    mimeType === "application/vnd.rar"
  ) {
    return "RAR";
  }
  if (mimeType === "application/x-7z-compressed") {
    return "7Z";
  }
  if (mimeType.startsWith("image/")) {
    const imageType = mimeType.split("/")[1];

    if (imageType === "jpeg") {
      return "JPG";
    }
    return imageType.toUpperCase();
  }

  if (mimeType === "text/plain") {
    return "TXT";
  }

  /*
   * Nếu MIME type không nằm trong danh sách trên,
   * lấy extension từ tên file.
   */
  const extension = getExtension(fileName);

  return extension ? extension.toUpperCase() : "";
}

function getExtension(name) {
  const value = String(name || "").trim();
  const lastDot = value.lastIndexOf(".");

  if (lastDot <= 0 || lastDot === value.length - 1) {
    return "";
  }
  return value.slice(lastDot + 1).toLowerCase();
}

function formatFileSize(bytes) {
  const value = Number(bytes);

  if (!Number.isFinite(value) || value < 0) {
    return "0 B";
  }
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(2)} KB`;
  }
  if (value < 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDisplayDate(date) {
  if (!date) {
    return "—";
  }

  const value = new Date(date);
  if (Number.isNaN(value.getTime())) {
    return "—";
  }

  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatDateTime(date) {
  if (!date) {
    return "";
  }

  const value = new Date(date);
  if (Number.isNaN(value.getTime())) {
    return "";
  }

  const offset = value.getTimezoneOffset();
  const local = new Date(value.getTime() - offset * 60000);

  return local.toISOString().slice(0, 16);
}
