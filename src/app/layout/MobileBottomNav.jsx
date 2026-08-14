import { Menu } from "lucide-react";
import { MOBILE_NAV_ITEMS } from "../navigation/navigationConfig";

export default function MobileBottomNav({ activeSection, onSelect, onOpenMenu }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d8ddcf] bg-white/96 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur xl:hidden">
      <div className="grid grid-cols-5 gap-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center transition ${
                isActive
                  ? "bg-[#10251d] text-white"
                  : "bg-[#f5f6ef] text-slate-500 hover:bg-[#eef3e8] hover:text-slate-900"
              }`}
            >
              <Icon size={18} strokeWidth={1.9} />
              <span className="truncate text-[11px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onOpenMenu}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[#d8ddcf] bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#eef3e8]"
      >
        <Menu size={16} />
        Ver todos los modulos
      </button>
    </div>
  );
}
