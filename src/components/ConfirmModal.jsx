import React from "react";

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
        </div>
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-light" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;