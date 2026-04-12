import { useEffect } from "react";

export default function ToastViewport({ toasts, onDismiss }) {
  useEffect(() => {
    if (toasts.length === 0) {
      return undefined;
    }

    const timers = toasts.map((toast) =>
      window.setTimeout(() => onDismiss(toast.id), 3200)
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [toasts, onDismiss]);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-3xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-2xl ring-1 ring-white/10"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
