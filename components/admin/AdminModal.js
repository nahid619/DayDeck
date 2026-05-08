"use client";
// components/admin/AdminModal.js
// Issues fixed: #15 Escape key closes, #17 unsaved-changes guard.

import { useEffect, useRef } from "react";
import styles from "./AdminModal.module.css";

export default function AdminModal({
  open, title, children,
  onClose, onConfirm, confirmLabel = "Save",
  confirmDanger = false, loading = false, error = "",
  isDirty = false,   // caller sets true when form has unsaved changes
}) {
  const confirmRef = useRef(null);

  // Escape key closes (#15)
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, isDirty]); // eslint-disable-line

  // Trap focus on confirm button when modal opens
  useEffect(() => {
    if (open && confirmRef.current) confirmRef.current.focus();
  }, [open]);

  function handleClose() {
    if (isDirty && !window.confirm("You have unsaved changes. Discard them?")) return;
    onClose();
  }

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.hdr}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>{children}</div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={handleClose} disabled={loading}>
            Cancel
          </button>
          <button
            ref={confirmRef}
            className={`${styles.confirmBtn} ${confirmDanger ? styles.confirmDanger : ""}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
