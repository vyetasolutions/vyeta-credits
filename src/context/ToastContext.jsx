import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

const STYLES = {
  success: "border-mint-500/40 bg-mint-500/10 text-mint-300",
  error: "border-flame-500/40 bg-flame-500/10 text-flame-300",
  info: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
};

const ICONS = {
  success: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 stroke-mint-400" strokeWidth="2">
      <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 stroke-flame-400" strokeWidth="2">
      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 stroke-violet-400" strokeWidth="2">
      <circle cx="10" cy="10" r="8" />
      <path d="M10 9v5M10 7v.5" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 stroke-amber-400" strokeWidth="2">
      <path d="M10 3L2 17h16L10 3z" strokeLinejoin="round" />
      <path d="M10 9v4M10 15v.5" strokeLinecap="round" />
    </svg>
  ),
};

function ToastStack({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto w-full max-w-sm flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-card animate-slideDown text-sm font-medium ${STYLES[t.type] || STYLES.info}`}
        >
          {ICONS[t.type] || ICONS.info}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="opacity-50 hover:opacity-100 text-xs">✕</button>
        </div>
      ))}
    </div>
  );
}
