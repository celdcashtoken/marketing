import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const toast = useCallback(({ message, type = 'success', duration = 4000 }) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-[12.5px] font-medium border animate-slide-in max-w-xs ${
              t.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : t.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-white border-stone-200 text-zinc-800'
            }`}
          >
            <span className="flex-shrink-0 text-base leading-none">
              {t.type === 'error' ? '✗' : t.type === 'warning' ? '⚠' : '✓'}
            </span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-1 text-current opacity-40 hover:opacity-80 text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
