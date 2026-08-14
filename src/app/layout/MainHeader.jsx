import { Lightbulb, Menu, PanelLeftClose, PanelLeftOpen, UserCog, Wifi, WifiOff } from "lucide-react";
import { SmartProfitIsotype } from "../../components/SmartProfitMark";

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
    <header data-testid="app-header" className="relative z-20 border-b border-[#d8ddcf] bg-[#f5f6ef]/95 px-4 py-4 md:px-6 xl:sticky xl:top-0 xl:z-50 xl:backdrop-blur">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onToggleNavigation}
            data-testid="menu-toggle"
            aria-label="Alternar navegacion"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#d8ddcf] bg-white text-slate-600 transition hover:bg-[#eef3e8]"
          >
            {isWideDesktop ? (
              isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />
            ) : (
              <Menu size={18} />
            )}
          </button>

          <div className="min-w-0" data-testid="business-context">
            <div className="flex min-w-0 items-center gap-2">
              <SmartProfitIsotype className="h-6 w-6 shrink-0 object-contain" />
              <p data-testid="business-name" className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900">
                {business?.name || "SmartProfit"}
              </p>
            </div>
            <h1 data-testid="module-name" className="mt-1 text-[2rem] font-black tracking-[-0.03em] text-slate-950 sm:text-2xl">
              {currentSectionMeta.title}
            </h1>
            <p data-testid="module-description" className="mt-1 max-w-2xl break-words text-sm leading-6 text-slate-500">
              {currentSectionMeta.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenDecisionCenter}
            disabled={!hasDecisions}
            data-testid="decision-center-button"
            aria-label="Abrir centro de decisiones"
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              hasDecisions
                ? "border-[#d7b75f] bg-[#fff8df] text-[#75560d] hover:bg-[#fff2bf]"
                : "cursor-not-allowed border-slate-200 bg-white text-slate-400"
            }`}
          >
            <Lightbulb size={14} />
            <span className="md:hidden">Decisiones</span>
            <span className="hidden md:inline">Centro de decisiones</span>
            <span
              data-testid="decision-center-count"
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${
                hasDecisions
                  ? "bg-white text-[#75560d] ring-[#d7b75f]/50"
                  : "bg-slate-50 text-slate-400 ring-slate-200"
              }`}
            >
              {decisionCount}
            </span>
          </button>
          <time data-testid="current-date" className="inline-flex items-center rounded-lg border border-[#d8ddcf] bg-white px-3 py-2 text-xs font-medium text-slate-600">
            {currentDateLabel}
          </time>
          <button
            type="button"
            onClick={onGoAccount}
            data-testid="user-menu-button"
            className="inline-flex items-center gap-2 rounded-lg border border-[#d8ddcf] bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#eef3e8]"
          >
            <UserCog size={14} />
            <span data-testid="user-name">{userDisplayName}</span>
          </button>
          <span
            data-testid="sync-status"
            aria-label="Estado de sincronizacion"
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
              isOnline
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span data-testid="sync-status-text">{isOnline ? "Sincronizacion activa" : "Trabajando sin conexion"}</span>
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-lg border border-[#d8ddcf] bg-white px-4 py-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-900">
            Enfoque del modulo
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
            {currentSectionGuidance.promise}
          </p>
        </article>
        <article className="rounded-lg border border-[#d8ddcf] bg-[linear-gradient(135deg,#ffffff_0%,#f8fbf3_100%)] px-4 py-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
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
