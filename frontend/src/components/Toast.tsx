import { createContext, useContext, useState, useCallback } from 'react';

export type ToastKind = 'ok' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

const TOAST_TIMEOUT_OK = 6000;
const TOAST_TIMEOUT_ERROR = 12000; // sticky for errors

const ToastContext = createContext<{
  push: (item: Omit<ToastItem, 'id'>) => void;
} | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { ...item, id }]);
    const timeout = item.kind === 'error' ? TOAST_TIMEOUT_ERROR : TOAST_TIMEOUT_OK;
    if (timeout !== TOAST_TIMEOUT_ERROR) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, timeout);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.push;
}
