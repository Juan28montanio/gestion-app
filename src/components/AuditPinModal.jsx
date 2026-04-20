import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import ModalWrapper from "./ModalWrapper";

export default function AuditPinModal({
  open,
  title,
  description,
  onClose,
  onVerify,
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setPin("");
      setError("");
      setIsBusy(false);
    }
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsBusy(true);
    setError("");

    try {
      const isValid = await onVerify(pin);
      if (!isValid) {
        setError("PIN invalido. Verifica el codigo de auditoria.");
      }
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      icon={{ main: <ShieldCheck size={20} />, close: <X size={18} /> }}
      title={title}
      description={description}
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          <span>PIN de auditoria</span>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="Ingresa el PIN"
            className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-lg tracking-[0.3em] outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
          />
        </label>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white"
          >
            {isBusy ? "Validando..." : "Confirmar"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
