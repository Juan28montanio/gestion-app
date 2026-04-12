import { useEffect, useMemo, useState } from "react";
import { Armchair, Coffee, DoorClosed, GlassWater, Store, UtensilsCrossed } from "lucide-react";
import { subscribeToTables } from "../services/tableService";

const TABLE_STATUS_STYLES = {
  disponible: "bg-emerald-500 text-white",
  ocupada: "bg-rose-500 text-white",
  cuenta_solicitada: "bg-amber-400 text-slate-900",
  pagada: "bg-sky-500 text-white",
  free: "bg-emerald-500 text-white",
  occupied: "bg-rose-500 text-white",
  requested_bill: "bg-amber-400 text-slate-900",
  paid: "bg-sky-500 text-white",
};

const TABLE_STATUS_LABELS = {
  disponible: "Disponible",
  ocupada: "Ocupada",
  cuenta_solicitada: "Cuenta solicitada",
  pagada: "Pagada",
  free: "Libre",
  occupied: "Ocupada",
  requested_bill: "Cuenta solicitada",
  paid: "Pagada",
};

const TABLE_ICONS = {
  UtensilsCrossed,
  Coffee,
  DoorClosed,
  GlassWater,
  Armchair,
  Store,
};

export default function TableView({
  businessId,
  selectedTableId,
  onSelectTable,
}) {
  const [tables, setTables] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToTables(businessId, (nextTables) => {
      setTables(nextTables.filter((table) => !table.deletedAt));
    });
    return () => unsubscribe();
  }, [businessId]);

  const visibleTables = useMemo(() => tables, [tables]);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Mapa de Mesas</h2>
          <p className="text-sm text-slate-500">
            Estados sincronizados en tiempo real con Firestore.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {visibleTables.length} mesa{visibleTables.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="h-[540px] overflow-y-auto pr-1">
        <div className="grid auto-rows-[132px] grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {visibleTables.map((table) => {
          const isSelected = selectedTableId === table.id;
          const statusStyle = TABLE_STATUS_STYLES[table.status] || "bg-slate-200 text-slate-800";
          const statusLabel = TABLE_STATUS_LABELS[table.status] || table.status;
          const Icon = TABLE_ICONS[table.icon] || UtensilsCrossed;

          return (
            <button
              key={table.id}
              type="button"
              onClick={() => onSelectTable(table)}
              className={`h-[132px] rounded-2xl border p-4 text-left transition ${
                isSelected
                  ? "border-slate-900 shadow-md"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                    <Icon size={16} />
                    <span>{table.name || `Mesa ${table.number}`}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {table.number}
                  </h3>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle}`}>
                  {statusLabel}
                </span>
              </div>

              <p className="text-sm text-slate-600">
                {table.capacity || table.seats
                  ? `${table.capacity || table.seats} puestos`
                  : "Capacidad no definida"}
              </p>
            </button>
          );
        })}
        </div>
      </div>
    </section>
  );
}
