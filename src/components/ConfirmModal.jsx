import ModalWrapper from "./ModalWrapper";

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Volver",
  tone = "danger",
  onConfirm,
  onCancel,
}) {
  const toneClasses =
    tone === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-500"
      : "bg-slate-950 text-white hover:bg-slate-800";

  return (
    <ModalWrapper
      open={open}
      onClose={onCancel}
      maxWidthClass="max-w-md"
      title={title}
      description={description}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${toneClasses}`}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalWrapper>
  );
}
