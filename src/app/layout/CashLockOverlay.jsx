export default function CashLockOverlay({ cashLockInfo, onGoFinance }) {
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-7 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
          Cierre pendiente
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-slate-950">
          Debes cerrar la jornada anterior
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{cashLockInfo.message}</p>
        <button
          type="button"
          onClick={onGoFinance}
          className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Ir a caja y finanzas
        </button>
      </div>
    </div>
  );
}
