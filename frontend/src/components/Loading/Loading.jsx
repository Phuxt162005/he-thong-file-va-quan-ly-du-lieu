import "./Loading.css";

export default function Loading({ message = "Đang tải..." }) {
  return (
    <div className="loading-component">
      <div className="loading-component__spinner"></div>
      <span>{message}</span>
    </div>
  );
}
