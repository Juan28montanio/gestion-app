import { useEffect, useState } from "react";
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
          {tables.length} mesa{tables.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="h-135 overflow-y-auto pr-1">
        <div className="grid auto-rows-[92px] grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => {
            const isSelected = selectedTableId === table.id;
            const statusStyle = TABLE_STATUS_STYLES[table.status] || "bg-slate-400 text-white";
            const statusLabel = TABLE_STATUS_LABELS[table.status] || table.status;
            const Icon = TABLE_ICONS[table.icon] || UtensilsCrossed;

            return (
              <button
                key={table.id}
                type="button"
                onClick={() => onSelectTable(table)}
                className={`h-23 rounded-2xl p-3 text-left transition ${
                  isSelected
                    ? "shadow-md ring-2 ring-slate-900"
                    : "shadow-sm hover:shadow-md"
                }`}
                style={{
                  background:
                    table.status === "ocupada" || table.status === "occupied"
                      ? "#fee2e2"
                      : table.status === "cuenta_solicitada" || table.status === "requested_bill"
                        ? "#fef3c7"
                        : table.status === "pagada" || table.status === "paid"
                          ? "#dbeafe"
                          : "#dcfce7",
                }}
              >
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
                        <Icon size={16} />
                        <span className="truncate">{table.name || `Mesa ${table.number}`}</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{table.number}</h3>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700">
                    {table.capacity || table.seats} puestos
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
