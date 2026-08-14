import { LogOut } from "lucide-react";
import BusinessAvatar from "./BusinessAvatar";
import SidebarNav from "./SidebarNav";

export default function MobileSidebarDrawer({
  open,
  business,
  userDisplayName,
  activeSection,
  navSections,
  onSelect,
  onClose,
  onLogout,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 xl:hidden">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="absolute inset-y-0 left-0 flex w-[min(86vw,340px)] flex-col border-r border-[#d8ddcf] bg-[#f5f6ef] px-4 py-4 shadow-2xl">
        <div className="shrink-0 flex items-center gap-3 rounded-lg border border-[#d8ddcf] bg-white px-4 py-4 shadow-sm">
          <BusinessAvatar business={business} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              {business?.name || "SmartProfit"}
            </p>
            <p className="truncate text-xs text-slate-500">{userDisplayName}</p>
          </div>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-lg border border-[#d8ddcf] bg-white/80 p-3 shadow-sm">
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

          <div className="sidebar-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            <SidebarNav
              activeSection={activeSection}
              isCollapsed={false}
              navSections={navSections}
              onSelect={(sectionId) => {
                onSelect(sectionId);
                onClose();
              }}
            />
          </div>
        </div>

        <div className="mt-4 shrink-0 border-t border-[#d8ddcf] pt-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg border border-[#d8ddcf] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#f5f6ef]"
          >
            <LogOut size={18} />
            Cerrar sesion
          </button>
        </div>
      </aside>
    </div>
  );
}
