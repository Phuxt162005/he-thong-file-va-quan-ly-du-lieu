import Modal from "../Modal/Modal";

export default function ConfirmDialog({
  isOpen,
  title = "Xác nhận",
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  danger = false,
  onConfirm,
  onCancel,
  loading = false,
}) {
  const footer = (
    <>
      <button
        className="btn btn-secondary"
        onClick={onCancel}
        disabled={loading}
      >
        {cancelText}
      </button>

      <button
        className={danger ? "btn btn-danger" : "btn btn-primary"}
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? "Đang xử lý..." : confirmText}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel} footer={footer}>
      <p>{message}</p>
    </Modal>
  );
}
