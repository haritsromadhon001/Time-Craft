import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Ya, Hapus',
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="modal-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem',
            marginBottom: '1.1rem',
          }}
        >
          <span
            className="icon-box-blue"
            style={{
              backgroundColor: 'var(--status-danger-bg)',
              color: 'var(--status-danger)',
            }}
            aria-hidden="true"
          >
            <AlertTriangle size={18} />
          </span>
          <div>
            <h2
              id="confirm-dialog-title"
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              {title}
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginTop: '0.3rem',
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.6rem',
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
