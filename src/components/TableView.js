import { useEffect, useState } from "react";
import { subscribeToTables } from "../services/tableService";

const TABLE_STATUS_STYLES = {
  free: "bg-emerald-500 text-white",
  occupied: "bg-rose-500 text-white",
  requested_bill: "bg-amber-400 text-slate-900",
  paid: "bg-sky-500 text-white",
};

const TABLE_STATUS_LABELS = {
  free: "Libre",
  occupied: "Ocupada",
  requested_bill: "Cuenta solicitada",
  paid: "Pagada",
};

export default function TableView({
  businessId,
  selectedTableId,
  onSelectTable,
}) {
  const [tables, setTables] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToTables(businessId, setTables);
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
          {tables.length} mesas
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {tables.map((table) => {
          const isSelected = selectedTableId === table.id;
          const statusStyle = TABLE_STATUS_STYLES[table.status] || "bg-slate-200 text-slate-800";
          const statusLabel = TABLE_STATUS_LABELS[table.status] || table.status;

          return (
            <button
              key={table.id}
              type="button"
              onClick={() => onSelectTable(table)}
              className={`rounded-2xl border p-4 text-left transition ${
                isSelected
                  ? "border-slate-900 shadow-md"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Mesa</p>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {table.number || table.name}
                  </h3>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle}`}>
                  {statusLabel}
                </span>
              </div>

              <p className="text-sm text-slate-600">
                {table.seats ? `${table.seats} puestos` : "Capacidad no definida"}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
