import "./FileItem.css";

export default function FileItem({ file, onPreview, onDelete }) {
  return (
    <div className="file-item">
      <div className="file-name">{file.name}</div>
      <div className="file-size">{file.size} bytes</div>

      <div className="file-action">
        <button onClick={() => onPreview(file)}>Preview</button>

        <button onClick={() => onDelete(file)}>Xóa</button>
      </div>
    </div>
  );
}
