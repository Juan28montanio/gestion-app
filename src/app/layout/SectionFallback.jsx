export default function SectionFallback({ title = "Cargando modulo" }) {
  return (
    <div className="rounded-lg border border-[#d8ddcf] bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-900">
        SmartProfit
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-5 grid gap-3">
        <div className="h-24 animate-pulse rounded-lg bg-[#eef3e8]" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-32 animate-pulse rounded-lg bg-[#eef3e8]" />
          <div className="h-32 animate-pulse rounded-lg bg-[#eef3e8]" />
        </div>
      </div>
    </div>
  );
}
