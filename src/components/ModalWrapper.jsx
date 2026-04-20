import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ModalWrapper({
  open,
  icon,
  title,
  description,
  children,
  onClose,
  maxWidthClass = "max-w-3xl",
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

        <div
          className={`relative z-[1] flex max-h-[88vh] w-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.18)] ${maxWidthClass}`}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
          >
            {icon?.close || "X"}
          </button>

          <div className="border-b border-slate-200 bg-slate-50/80 px-6 pb-5 pt-6 sm:px-8">
            {icon?.main ? (
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700">
                {icon.main}
              </div>
            ) : null}
            <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-2xl">
              {title}
            </h3>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
