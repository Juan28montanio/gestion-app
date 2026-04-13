export default function FormModal({
  open,
  icon,
  title,
  description,
  children,
  onClose,
  maxWidthClass = "max-w-3xl",
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/45 px-4 pb-8 pt-24 backdrop-blur-sm sm:px-6 sm:pb-10 sm:pt-28">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full items-start justify-center sm:min-h-[calc(100vh-9.5rem)]">
        <div
          className={`relative flex max-h-[calc(100vh-8rem)] w-full flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-200 sm:max-h-[calc(100vh-9.5rem)] ${maxWidthClass}`}
        >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
        >
          {icon?.close || "X"}
        </button>

        <div className="sticky top-0 z-[1] border-b border-slate-100 bg-white px-6 pb-5 pt-6 sm:px-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-600">
            {icon?.main || null}
          </div>
          <h3 className="mt-5 text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h3>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
