import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export default function POSSearchSelector({
  label,
  placeholder,
  items,
  selectedItem,
  onSelectItem,
  getLabel,
  getDescription,
  icon: Icon,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return items;
    }

    return items.filter((item) => {
      const labelValue = getLabel(item).toLowerCase();
      const descriptionValue = String(getDescription?.(item) || "").toLowerCase();
      return `${labelValue} ${descriptionValue}`.includes(term);
    });
  }, [getDescription, getLabel, items, search]);

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full min-w-0 items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-slate-200 transition hover:ring-emerald-300"
      >
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">
            {selectedItem ? getLabel(selectedItem) : placeholder}
          </p>
        </div>
        <ChevronDown size={16} className="text-slate-400" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 rounded-[24px] bg-white p-3 shadow-2xl ring-1 ring-slate-200">
          <div className="mb-3 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Buscar ${label.toLowerCase()}...`}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto">
            {filteredItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectItem(item);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition ${
                    isSelected
                      ? "bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] text-white"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {Icon ? (
                      <div className={`rounded-2xl p-2 ${isSelected ? "bg-white/10" : "bg-white"}`}>
                        <Icon size={16} />
                      </div>
                    ) : null}
                    <div>
                      <p className="text-sm font-semibold">{getLabel(item)}</p>
                      <p className={`text-xs ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                        {getDescription?.(item)}
                      </p>
                    </div>
                  </div>
                  {isSelected ? <Check size={16} /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
