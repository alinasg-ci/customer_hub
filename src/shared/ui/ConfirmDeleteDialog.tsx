'use client';

import { useState, useEffect, useRef } from 'react';

type ConfirmDeleteDialogProps = {
  readonly open: boolean;
  readonly title: string;
  readonly message: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly loading?: boolean;
};

export function ConfirmDeleteDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDeleteDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setConfirmed(false);
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="clay-card-static mx-4 w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-pomegranate-400/10">
            <svg className="h-5 w-5 text-pomegranate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-black">{title}</h3>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-charcoal-500">{message}</p>

        <label className="mb-5 block">
          <span className="text-sm text-charcoal-500">
            Type <strong className="text-black">DELETE</strong> to confirm:
          </span>
          <input
            type="text"
            className="clay-input mt-1.5 w-full text-sm"
            onChange={(e) => setConfirmed(e.target.value === 'DELETE')}
            placeholder="DELETE"
          />
        </label>

        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="clay-btn clay-btn-secondary text-sm"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed || loading}
            className="clay-btn clay-btn-danger text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
