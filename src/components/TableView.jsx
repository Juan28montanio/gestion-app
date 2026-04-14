import { useEffect, useState } from "react";
import {
  Armchair,
  Coffee,
  DoorClosed,
  Flame,
  GlassWater,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { subscribeToActiveOrders } from "../services/orderService";
import { subscribeToTables } from "../services/tableService";

const TABLE_STATUS_STYLES = {
  disponible: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  ocupada: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  cuenta_solicitada: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  pagada: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  free: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  occupied: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  requested_bill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  paid: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
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
  Flame,
};

export default function TableView({
  businessId,
  selectedTableId,
  onSelectTable,
}) {
  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToTables(businessId, (nextTables) => {
      setTables(nextTables.filter((table) => !table.deletedAt));
    });
    return () => unsubscribe();
  }, [businessId]);

  useEffect(() => {
    const unsubscribe = subscribeToActiveOrders(businessId, setActiveOrders);
    return () => unsubscribe();
  }, [businessId]);

  return (
    <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
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
        <div className="grid auto-rows-[128px] grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => {
            const isSelected = selectedTableId === table.id;
            const statusStyle = TABLE_STATUS_STYLES[table.status] || "bg-slate-400 text-white";
            const statusLabel = TABLE_STATUS_LABELS[table.status] || table.status;
            const Icon = TABLE_ICONS[table.icon] || UtensilsCrossed;
            const currentOrder = activeOrders.find((order) => order.table_id === table.id);
            const orderPreview =
              table.current_order_summary ||
              (currentOrder?.items || [])
                .slice(0, 2)
                .map((item) => `${item.quantity}x ${item.name}`)
                .join(", ");
            const orderTotal = Number(table.current_total ?? currentOrder?.total ?? 0);

            return (
              <button
                key={table.id}
                type="button"
                onClick={() => onSelectTable(table)}
                className={`min-h-32 rounded-3xl p-3 text-left transition ${
                  isSelected
                    ? "shadow-lg ring-2 ring-emerald-500"
                    : "shadow-sm ring-1 ring-white/60 hover:shadow-md"
                }`}
                style={{
                  background:
                    table.status === "ocupada" || table.status === "occupied"
                      ? "linear-gradient(180deg,#fff1f2 0%,#ffe4e6 100%)"
                      : table.status === "cuenta_solicitada" || table.status === "requested_bill"
                        ? "linear-gradient(180deg,#fffbeb 0%,#fef3c7 100%)"
                        : table.status === "pagada" || table.status === "paid"
                          ? "linear-gradient(180deg,#eff6ff 0%,#dbeafe 100%)"
                          : "linear-gradient(180deg,#ecfdf5 0%,#d1fae5 100%)",
                }}
              >
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <div
                          className={`rounded-full p-1.5 ring-2 ${
                            table.status === "ocupada" || table.status === "occupied"
                              ? "bg-white/80 ring-rose-300"
                              : table.status === "cuenta_solicitada" ||
                                  table.status === "requested_bill"
                                ? "bg-white/80 ring-amber-300"
                                : table.status === "pagada" || table.status === "paid"
                                  ? "bg-white/80 ring-sky-300"
                                  : "bg-white/80 ring-emerald-300"
                          }`}
                        >
                          <Icon size={14} />
                        </div>
                        <span className="truncate">{table.name || `Mesa ${table.number}`}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-950">{table.number}</h3>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-slate-700">{table.capacity || table.seats} puestos</p>
                    {currentOrder ? (
                      <>
                        <p className="line-clamp-2 text-[11px] leading-4 text-slate-600">
                          Pedido actual: {orderPreview || `${currentOrder.items?.length || 0} items`}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-700">
                          Total actual: {new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: "COP",
                            maximumFractionDigits: 0,
                          }).format(orderTotal)}
                        </p>
                      </>
                    ) : null}
                  </div>

                  <div className="flex items-end justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyle}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
