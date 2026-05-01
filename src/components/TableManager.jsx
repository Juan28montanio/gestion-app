import { useEffect, useMemo, useState } from "react";
import {
  Armchair,
  Clock3,
  Coffee,
  DoorClosed,
  Ellipsis,
  Flame,
  GlassWater,
  Pencil,
  Plus,
  Store,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import {
  createTable,
  deleteTable,
  subscribeToTables,
  updateTable,
} from "../services/tableService";
import { subscribeToActiveOrders } from "../services/orderService";
import ConfirmModal from "./ConfirmModal";

const EMPTY_FORM = {
  number: "",
  name: "",
  icon: "UtensilsCrossed",
  capacity: "",
};

const TABLE_ICON_OPTIONS = [
  { value: "UtensilsCrossed", label: "Restaurante", icon: UtensilsCrossed },
  { value: "Coffee", label: "Cafe", icon: Coffee },
  { value: "Armchair", label: "Lounge", icon: Armchair },
  { value: "GlassWater", label: "Barra", icon: GlassWater },
  { value: "DoorClosed", label: "Privado", icon: DoorClosed },
  { value: "Store", label: "Terraza", icon: Store },
  { value: "Flame", label: "Parrilla", icon: Flame },
];

function formatTableStatus(status) {
  const normalizedStatus = String(status || "disponible").toLowerCase();

  const labels = {
    disponible: "Disponible",
    ocupada: "Ocupada",
    pagada: "Pagada",
    cuenta_solicitada: "Cuenta solicitada",
    free: "Disponible",
    occupied: "Ocupada",
    paid: "Pagada",
    requested_bill: "Cuenta solicitada",
  };

  return labels[normalizedStatus] || normalizedStatus;
}

function getTableStatusClasses(status) {
  const normalizedStatus = String(status || "disponible").toLowerCase();

  const styles = {
    disponible: "bg-emerald-100 text-emerald-800",
    ocupada: "bg-rose-100 text-rose-800",
    pagada: "bg-sky-100 text-sky-800",
    cuenta_solicitada: "bg-amber-100 text-amber-800",
    free: "bg-emerald-100 text-emerald-800",
    occupied: "bg-rose-100 text-rose-800",
    paid: "bg-sky-100 text-sky-800",
    requested_bill: "bg-amber-100 text-amber-800",
  };

  return styles[normalizedStatus] || "bg-slate-100 text-slate-700";
}

function getElapsedLabel(timestamp) {
  const createdAt = timestamp?.toDate ? timestamp.toDate() : null;
  if (!createdAt) {
    return "";
  }

  const minutes = Math.max(1, Math.round((Date.now() - createdAt.getTime()) / 60000));
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes ? `${hours} h ${restMinutes} min` : `${hours} h`;
}

function getOperationalMessage(table, currentOrder) {
  const normalizedStatus = String(table.status || "disponible").toLowerCase();
  const itemCount = (currentOrder?.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  if (normalizedStatus === "cuenta_solicitada" || normalizedStatus === "requested_bill") {
    return "Lista para cierre y cobro.";
  }

  if (normalizedStatus === "ocupada" || normalizedStatus === "occupied") {
    if (itemCount > 0) {
      return `Pedido abierto con ${itemCount} item${itemCount === 1 ? "" : "s"} registrados.`;
    }
    return "Mesa ocupada pendiente de registrar pedido.";
  }

  if (normalizedStatus === "pagada" || normalizedStatus === "paid") {
    return "Servicio cerrado. Puede volver a habilitarse.";
  }

  return "Disponible para abrir servicio.";
}

function getOrderedItemsPreview(order) {
  const names = (order?.items || [])
    .map((item) => String(item.name || "").trim())
    .filter(Boolean);

  return {
    visible: names.slice(0, 2),
    extra: Math.max(names.length - 2, 0),
  };
}

export default function TableManager({ businessId, selectedTableId, onSelectTable, onNotify }) {
  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);

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

  const sortedTables = useMemo(
    () => [...tables].sort((a, b) => Number(a.number || 0) - Number(b.number || 0)),
    [tables]
  );
  const tableSummary = useMemo(() => {
    return sortedTables.reduce(
      (summary, table) => {
        const status = String(table.status || "disponible").toLowerCase();
        if (status === "ocupada" || status === "occupied") {
          summary.occupied += 1;
        } else if (status === "cuenta_solicitada" || status === "requested_bill") {
          summary.requestedBill += 1;
        } else {
          summary.available += 1;
        }
        return summary;
      },
      { available: 0, occupied: 0, requestedBill: 0 }
    );
  }, [sortedTables]);

  const selectedIconOption = useMemo(
    () =>
      TABLE_ICON_OPTIONS.find((option) => option.value === formState.icon) ||
      TABLE_ICON_OPTIONS[0],
    [formState.icon]
  );
  const SelectedIcon = selectedIconOption.icon;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const closeModal = () => {
    setFormState(EMPTY_FORM);
    setEditingId(null);
    setFeedback({ type: "", message: "" });
    setIsModalOpen(false);
  };

  const openCreateModal = () => {
    setFormState(EMPTY_FORM);
    setEditingId(null);
    setFeedback({ type: "", message: "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      if (editingId) {
        await updateTable(editingId, businessId, formState);
        onNotify?.(`${formState.name || `Mesa ${formState.number}`} actualizada.`);
      } else {
        await createTable(businessId, formState);
        onNotify?.(`${formState.name || `Mesa ${formState.number}`} creada correctamente.`);
      }

      closeModal();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible guardar la mesa.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (table) => {
    setEditingId(table.id);
    setFormState({
      number: String(table.number ?? ""),
      name: String(table.name ?? ""),
      icon: String(table.icon ?? "UtensilsCrossed"),
      capacity: String(table.capacity ?? table.seats ?? ""),
    });
    setFeedback({ type: "", message: "" });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!tableToDelete) {
      return;
    }

    try {
      await deleteTable(tableToDelete.id);

      if (editingId === tableToDelete.id) {
        closeModal();
      }

      onNotify?.(`${tableToDelete.name || `Mesa ${tableToDelete.number}`} eliminada.`);
      setFeedback({ type: "success", message: "Mesa eliminada correctamente." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible eliminar la mesa.",
      });
    } finally {
      setTableToDelete(null);
    }
  };

  return (
    <section className="rounded-[28px] bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Salon</h2>
        <p className="text-sm text-slate-500">
          Supervisa ocupacion, pedido activo y mesas listas para cobrar desde una sola vista.
        </p>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <article className="rounded-[24px] bg-emerald-50 p-4 ring-1 ring-emerald-200">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Disponibles</p>
          <p className="mt-2 text-2xl font-black text-emerald-900">{tableSummary.available}</p>
        </article>
        <article className="rounded-[24px] bg-rose-50 p-4 ring-1 ring-rose-200">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700">Ocupadas</p>
          <p className="mt-2 text-2xl font-black text-rose-900">{tableSummary.occupied}</p>
        </article>
        <article className="rounded-[24px] bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Listas para cobrar</p>
          <p className="mt-2 text-2xl font-black text-amber-900">{tableSummary.requestedBill}</p>
        </article>
      </div>

      <div className="rounded-[28px] bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Mesas activas</h3>
            <p className="text-sm text-slate-500">Selecciona una mesa o usa el menu contextual para gestionarla.</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            {sortedTables.length} mesa{sortedTables.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="h-[640px] overflow-y-auto pr-1">
          <div className="grid auto-rows-[248px] gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedTables.map((table) => {
              const Icon =
                TABLE_ICON_OPTIONS.find((option) => option.value === table.icon)?.icon ||
                UtensilsCrossed;
              const currentOrder = activeOrders.find((order) => order.table_id === table.id);
              const itemCount = (currentOrder?.items || []).reduce(
                (sum, item) => sum + Number(item.quantity || 0),
                0
              );
              const orderTotal = Number(table.current_total ?? currentOrder?.total ?? 0);
              const customerName = currentOrder?.customer_name || "";
              const elapsed = getElapsedLabel(currentOrder?.created_at);
              const operationalMessage = getOperationalMessage(table, currentOrder);
              const orderedItemsPreview = getOrderedItemsPreview(currentOrder);
              const normalizedStatus = String(table.status || "").toLowerCase();
              const isBusy = normalizedStatus === "ocupada" || normalizedStatus === "occupied";
              const isSelected = selectedTableId === table.id;

              return (
                <article
                  key={table.id}
                  className={`group relative flex h-[248px] flex-col rounded-[28px] bg-white p-5 shadow-lg transition-shadow hover:shadow-xl ${
                    isSelected
                      ? "ring-2 ring-emerald-500"
                      : isBusy
                        ? "ring-1 ring-rose-200"
                        : "ring-1 ring-emerald-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectTable?.(table)}
                    className="absolute inset-0 rounded-[28px]"
                    aria-label={`Seleccionar ${table.name || `Mesa ${table.number}`}`}
                  />

                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                        <div className={`rounded-full p-2 ${isBusy ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                          <Icon size={14} />
                        </div>
                        <span className="truncate">{table.name || `Mesa ${table.number}`}</span>
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                        Mesa {table.number}
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      {orderTotal > 0 ? (
                        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                          ${orderTotal.toLocaleString("es-CO")}
                        </span>
                      ) : null}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActionMenuId((current) => (current === table.id ? null : table.id))}
                          className="rounded-full bg-slate-100 p-2 text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-slate-200"
                        >
                          <Ellipsis size={16} />
                        </button>
                        {actionMenuId === table.id ? (
                          <div className="absolute right-0 top-[calc(100%+0.4rem)] z-20 w-40 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
                            <button
                              type="button"
                              onClick={() => {
                                setActionMenuId(null);
                                handleEdit(table);
                              }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <Pencil size={15} />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActionMenuId(null);
                                setTableToDelete(table);
                              }}
                              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 size={15} />
                              Eliminar
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 mt-4 flex flex-1 flex-col">
                    <div className="grid flex-1 gap-4 md:grid-cols-[110px_minmax(0,1fr)]">
                      <div className="rounded-[24px] bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                        <p className="text-5xl font-black leading-none text-slate-900">
                          {table.capacity || table.seats}
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-500">puestos</p>
                      </div>

                      <div className="flex min-h-0 flex-col justify-between">
                        <div>
                          <p className="text-sm leading-6 text-slate-500">{operationalMessage}</p>

                          {itemCount > 0 || elapsed || customerName ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {orderedItemsPreview.visible.map((name) => (
                                <span
                                  key={name}
                                  className="max-w-full truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                                >
                                  {name}
                                </span>
                              ))}
                              {orderedItemsPreview.extra > 0 ? (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                                  +{orderedItemsPreview.extra} mas
                                </span>
                              ) : null}
                              {elapsed ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                  <Clock3 size={12} />
                                  {elapsed}
                                </span>
                              ) : null}
                              {customerName ? (
                                <span className="max-w-full truncate rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                                  {customerName}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {itemCount > 0 ? (
                            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                              {itemCount} item{itemCount === 1 ? "" : "s"}
                            </span>
                          ) : null}
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${getTableStatusClasses(table.status)}`}
                          >
                            <span className="h-2 w-2 rounded-full bg-current opacity-80 shadow-[0_0_12px_currentColor]" />
                            {formatTableStatus(table.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            <button
              type="button"
              onClick={openCreateModal}
              className="flex h-[248px] flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-300 bg-white/70 p-5 text-center text-slate-500 transition hover:border-slate-400 hover:bg-white hover:text-slate-700"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Plus size={28} />
              </div>
              <h4 className="mt-4 text-base font-semibold text-slate-700">Nueva mesa</h4>
              <p className="mt-1 text-sm text-slate-500">Agregar al salon</p>
            </button>
          </div>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {editingId ? "Editar mesa" : "Nueva mesa"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Configura numero, nombre, icono y capacidad en una sola vista.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="grid min-w-0 gap-2 text-sm text-slate-700">
                    Numero
                    <input
                      required
                      min="1"
                      step="1"
                      inputMode="numeric"
                      type="number"
                      name="number"
                      value={formState.number}
                      onChange={handleChange}
                      className="block w-full rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-slate-400"
                    />
                  </label>

                  <label className="grid min-w-0 gap-2 text-sm text-slate-700">
                    Nombre
                    <input
                      required
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      placeholder="Terraza 1, Barra, VIP..."
                      className="block w-full rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-slate-400"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[0.8fr_1.2fr]">
                  <label className="grid min-w-0 gap-2 text-sm text-slate-700">
                    Capacidad
                    <input
                      required
                      min="1"
                      step="1"
                      inputMode="numeric"
                      type="number"
                      name="capacity"
                      value={formState.capacity}
                      onChange={handleChange}
                      className="block w-full rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-slate-400"
                    />
                  </label>

                  <label className="grid min-w-0 gap-2 text-sm text-slate-700">
                    Icono
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                      <SelectedIcon size={18} className="text-slate-500" />
                      <select
                        name="icon"
                        value={formState.icon}
                        onChange={handleChange}
                        className="block w-full bg-transparent outline-none"
                      >
                        {TABLE_ICON_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                </div>
              </div>

              {feedback.message ? (
                <div
                  className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                    feedback.type === "error"
                      ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  }`}
                >
                  {feedback.message}
                </div>
              ) : null}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? "Guardando..." : editingId ? "Actualizar mesa" : "Crear mesa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(tableToDelete)}
        title="Eliminar mesa"
        description={
          tableToDelete
            ? `Se eliminara ${tableToDelete.name || `Mesa ${tableToDelete.number}`}. Si la mesa esta ocupada el sistema bloqueara la accion.`
            : ""
        }
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setTableToDelete(null)}
      />
    </section>
  );
}
