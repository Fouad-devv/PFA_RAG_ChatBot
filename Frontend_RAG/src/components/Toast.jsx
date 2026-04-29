import { useState, useEffect } from "react";

const listeners = new Set();

export const showToast = (message, type = "success") => {
  const id = Date.now() + Math.random();
  listeners.forEach((fn) => fn({ id, message, type }));
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 2800);
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-slide-in-right flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white max-w-xs ${
            t.type === "error" ? "bg-red-600" : "bg-slate-900"
          }`}
        >
          {t.type === "error" ? (
            <svg className="w-4 h-4 text-red-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
};
