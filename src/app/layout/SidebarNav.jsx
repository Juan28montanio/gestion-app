export default function SidebarNav({
  activeSection,
  isCollapsed,
  navSections,
  onSelect,
}) {
  return (
    <nav className={`min-h-0 ${isCollapsed ? "" : "pr-1"}`}>
      <div className="grid gap-6 pb-4">
        {Object.entries(navSections).map(([sectionLabel, items]) => (
          <div key={sectionLabel} className="grid gap-2">
            {!isCollapsed ? (
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {sectionLabel}
              </p>
            ) : null}

            <div className="grid gap-1.5">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    data-testid={`nav-module-${item.id}`}
                    aria-current={isActive ? "page" : undefined}
                    className={`group flex items-center rounded-lg border px-3 py-3 text-left transition ${
                      isActive
                        ? "border-emerald-900 bg-[#10251d] text-white shadow-sm"
                        : "border-transparent text-slate-600 hover:border-[#d8ddcf] hover:bg-[#f5f6ef] hover:text-slate-950"
                    } ${isCollapsed ? "justify-center" : "gap-3"}`}
                  >
                    <Icon size={18} strokeWidth={1.9} />
                    {!isCollapsed ? (
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-5">{item.label}</p>
                        <p
                          className={`text-xs leading-5 ${
                            isActive ? "text-slate-300" : "text-slate-400"
                          }`}
                        >
                          {item.description}
                        </p>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
