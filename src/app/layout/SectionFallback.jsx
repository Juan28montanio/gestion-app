export default function SectionFallback({ title = "Cargando modulo" }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        SmartProfit
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-5 grid gap-3">
        <div className="h-24 animate-pulse rounded-[24px] bg-slate-100" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-32 animate-pulse rounded-[24px] bg-slate-100" />
          <div className="h-32 animate-pulse rounded-[24px] bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
