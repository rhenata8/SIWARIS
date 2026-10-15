import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Info, X, AlertTriangle } from 'lucide-react';

/**
 * SIWARIS v2.1 — Toast & In-App Confirm system.
 * ToastProvider harus berada paling luar (di atas AuthProvider/AppProvider)
 * agar notifikasi tetap tampil saat halaman berganti (mis. setelah logout).
 */

export type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends Required<Pick<ConfirmDialogOptions, 'title' | 'message' | 'confirmLabel' | 'cancelLabel' | 'danger'>> {
  resolve: (value: boolean) => void;
}

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

export interface ToastPayload {
  type: ToastKind;
  message: string;
}

/**
 * showToast mendukung dua bentuk pemanggilan:
 *   showToast({ type: 'success', message: 'Pesan' })
 *   showToast('success', 'Pesan')
 */
export type ShowToastFn = {
  (payload: ToastPayload): void;
  (type: ToastKind, message: string): void;
};

interface ToastContextValue {
  toast: ToastApi;
  showToast: ShowToastFn;
  confirmDialog: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const TOAST_DURATION_MS = 3500;
const TOAST_MAX_VISIBLE = 3;

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toastIcons: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 size={18} color="#16a34a" />,
  error: <XCircle size={18} color="#dc2626" />,
  info: <Info size={18} color="#2563eb" />,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const nextIdRef = useRef(1);
  const timeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timeoutsRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextIdRef.current++;
      setToasts((prev) => [...prev, { id, kind, message }]);
      const timer = setTimeout(() => {
        removeToast(id);
      }, TOAST_DURATION_MS);
      timeoutsRef.current.set(id, timer);
    },
    [removeToast]
  );

  const toast = useMemo<ToastApi>(
    () => ({
      success: (message: string) => pushToast('success', message),
      error: (message: string) => pushToast('error', message),
      info: (message: string) => pushToast('info', message),
    }),
    [pushToast]
  );

  const showToast = useCallback<ShowToastFn>(
    (payloadOrType: ToastPayload | ToastKind, maybeMessage?: string) => {
      if (typeof payloadOrType === 'string') {
        pushToast(payloadOrType, maybeMessage ?? '');
      } else {
        pushToast(payloadOrType.type, payloadOrType.message);
      }
    },
    [pushToast]
  );

  const settleConfirm = useCallback(
    (value: boolean) => {
      setConfirmState((prev) => {
        if (prev) prev.resolve(value);
        return null;
      });
    },
    []
  );

  const confirmDialog = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Ya, Lanjutkan',
        cancelLabel: options.cancelLabel ?? 'Batal',
        danger: options.danger ?? false,
        resolve,
      });
    });
  }, []);

  // Escape menutup dialog konfirmasi (batal)
  useEffect(() => {
    if (!confirmState) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settleConfirm(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmState, settleConfirm]);

  // Bersihkan timer tersisa saat provider unmount
  useEffect(() => {
    const timers = timeoutsRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const contextValue = useMemo<ToastContextValue>(
    () => ({ toast, showToast, confirmDialog }),
    [toast, showToast, confirmDialog]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Stack toast — fixed top-right, di atas modal */}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.slice(-TOAST_MAX_VISIBLE).map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <span className="toast-icon">{toastIcons[t.kind]}</span>
            <div className="toast-message">{t.message}</div>
            <button
              type="button"
              className="toast-close"
              onClick={() => removeToast(t.id)}
              aria-label="Tutup notifikasi"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Konfirmasi in-app (pengganti window.confirm) */}
      {confirmState && (
        <div
          className="modal-overlay confirm-overlay"
          onClick={() => settleConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-label={confirmState.title}
        >
          <div className="modal-dialog small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body confirm-body">
              <div className={`confirm-icon-wrap ${confirmState.danger ? 'danger' : 'info'}`}>
                {confirmState.danger ? (
                  <AlertTriangle size={24} color="#dc2626" />
                ) : (
                  <Info size={24} color="#2563eb" />
                )}
              </div>
              <h4 className="confirm-title">{confirmState.title}</h4>
              <p className="confirm-message">{confirmState.message}</p>
            </div>
            <div className="modal-footer confirm-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => settleConfirm(false)}
              >
                {confirmState.cancelLabel}
              </button>
              <button
                type="button"
                className={`btn ${confirmState.danger ? 'confirm-btn-danger' : 'btn-primary'}`}
                onClick={() => settleConfirm(true)}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast harus dipakai di dalam <ToastProvider>');
  }
  return ctx;
};
