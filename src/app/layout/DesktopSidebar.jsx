import { LogOut } from "lucide-react";
import BusinessAvatar from "./BusinessAvatar";
import SidebarNav from "./SidebarNav";

export default function DesktopSidebar({
  business,
  userDisplayName,
  activeSection,
  isCollapsed,
  navSections,
  onSelect,
  onLogout,
}) {
  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 border-r border-[#d8ddcf] bg-[#f5f6ef] transition-all xl:flex xl:flex-col ${
        isCollapsed ? "w-24 px-3 py-4" : "w-[308px] px-4 py-4"
      }`}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 rounded-lg border border-[#d8ddcf] bg-white px-4 py-4 shadow-sm">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
            <BusinessAvatar business={business} />
            {!isCollapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">
                  {business?.name || "SmartProfit"}
                </p>
                <p className="truncate text-xs text-slate-500">{userDisplayName}</p>
              </div>
            ) : null}
          </div>

          {!isCollapsed ? (
            <div className="mt-4 rounded-lg bg-[#f5f6ef] px-3 py-3 ring-1 ring-[#d8ddcf]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-900">
                Espacio de trabajo
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Navega por ventas, recursos, caja y configuracion sin perder contexto.
              </p>
            </div>
          ) : null}
        </div>

        <div
          className={`mt-4 flex min-h-0 flex-1 flex-col rounded-lg border border-[#d8ddcf] bg-white/80 shadow-sm ${
            isCollapsed ? "p-2" : "p-3"
          }`}
        >
          {!isCollapsed ? (
            <div className="mb-3 flex shrink-0 items-center justify-between border-b border-slate-100 px-2 pb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Navegacion
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Desliza para ver todos los modulos.
                </p>
              </div>
            </div>
          ) : null}

          <div
            className={`min-h-0 flex-1 ${
              isCollapsed ? "overflow-hidden" : "sidebar-scroll overflow-x-hidden overflow-y-auto"
            }`}
          >
            <SidebarNav
              activeSection={activeSection}
              isCollapsed={isCollapsed}
              navSections={navSections}
              onSelect={onSelect}
            />
          </div>
        </div>

        <div className="mt-4 shrink-0 border-t border-[#d8ddcf] pt-4">
          <button
            type="button"
            onClick={onLogout}
            className={`flex w-full items-center rounded-lg border border-[#d8ddcf] bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#f5f6ef] ${
              isCollapsed ? "justify-center px-2" : "gap-3 px-4"
            }`}
          >
            <LogOut size={18} />
            {!isCollapsed ? "Cerrar sesion" : null}
          </button>
        </div>
      </div>
    </aside>
  );
}
