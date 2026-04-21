import { Lightbulb, Menu, PanelLeftClose, PanelLeftOpen, UserCog, Wifi, WifiOff } from "lucide-react";

export default function MainHeader({
  business,
  currentDateLabel,
  currentSectionMeta,
  currentSectionGuidance,
  decisionCount = 0,
  isOnline,
  isSidebarCollapsed,
  isWideDesktop,
  userDisplayName,
  onOpenDecisionCenter,
  onToggleNavigation,
  onGoAccount,
}) {
  const hasDecisions = decisionCount > 0;

  return (
    <header className="relative z-20 border-b border-slate-200 bg-[#f4f6f8] px-4 py-4 md:px-6 xl:sticky xl:top-0 xl:z-50 xl:bg-[#f4f6f8]/95 xl:backdrop-blur">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onToggleNavigation}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            {isWideDesktop ? (
              isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />
            ) : (
              <Menu size={18} />
            )}
          </button>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              {business?.name || "SmartProfit"}
            </p>
            <h1 className="mt-1 text-[2rem] font-bold tracking-[-0.03em] text-slate-950 sm:text-2xl">
              {currentSectionMeta.title}
            </h1>
            <p className="mt-1 max-w-2xl break-words text-sm leading-6 text-slate-500">
              {currentSectionMeta.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenDecisionCenter}
            disabled={!hasDecisions}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
              hasDecisions
                ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                : "cursor-not-allowed border-slate-200 bg-white text-slate-400"
            }`}
          >
            <Lightbulb size={14} />
            <span className="md:hidden">Decisiones</span>
            <span className="hidden md:inline">Centro de decisiones</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${
                hasDecisions
                  ? "bg-white text-amber-700 ring-amber-200"
                  : "bg-slate-50 text-slate-400 ring-slate-200"
              }`}
            >
              {decisionCount}
            </span>
          </button>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
            {currentDateLabel}
          </span>
          <button
            type="button"
            onClick={onGoAccount}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <UserCog size={14} />
            {userDisplayName}
          </button>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
              isOnline
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isOnline ? "Sincronizacion activa" : "Trabajando sin conexion"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[24px] bg-white px-4 py-4 shadow-sm ring-1 ring-white/80 transition-transform duration-200 hover:-translate-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Enfoque del modulo
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
            {currentSectionGuidance.promise}
          </p>
        </article>
        <article className="rounded-[24px] bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 shadow-sm ring-1 ring-slate-200 transition-transform duration-200 hover:-translate-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Flujo recomendado
          </p>
          <p className="mt-2 break-words text-sm leading-6 text-slate-600">
            {currentSectionGuidance.workflow}
          </p>
        </article>
      </div>
    </header>
  );
}
