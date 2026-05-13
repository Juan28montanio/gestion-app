import { useEffect, useMemo, useState } from "react";
import {
  Armchair,
  CheckCircle2,
  ChefHat,
  Clock3,
  Coffee,
  DoorClosed,
  Eraser,
  GlassWater,
  HandCoins,
  LayoutGrid,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Send,
  Store,
  Trash2,
  UsersRound,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { getTicketWalletState, subscribeToCustomers } from "../services/customerService";
import { normalizeProductForOrder, subscribeToAvailableProducts } from "../services/productService";
import {
  createTable,
  deleteTable,
  disableTable,
  subscribeToTables,
  updateTable,
} from "../services/tableService";
import { subscribeToActiveOrders } from "../services/orderService";
import {
  cancelOrderItem,
  openTableSession,
  reassignWaiter,
  releaseCleanTable,
  requestTableBill,
  sendOrderToKitchen,
  subscribeToActiveTableSessions,
  subscribeToKitchenTickets,
  subscribeToTableEvents,
  transferTableSession,
  updateKitchenTicketStatus,
} from "../services/salonService";
import {
  TABLE_STATUS_LABELS,
  buildItemsSummary,
  calculateItemsCount,
  calculateOrderTotal,
  calculateTableDuration,
  canCancelItem,
  canCloseTable,
  canOpenTable,
  canTransferTable,
  formatDuration,
  getSessionAlerts,
  getTableVisualStatus,
  normalizeTableStatus,
} from "../utils/salon";
import { formatCOP } from "../utils/formatters";
import ModalWrapper from "./ModalWrapper";
import ConfirmModal from "./ConfirmModal";

const EMPTY_TABLE_FORM = {
  number: "",
  name: "",
  code: "",
  zone: "Salon principal",
  capacity: "4",
  icon: "UtensilsCrossed",
  shape: "square",
  size: "md",
  status: "free",
  isActive: true,
};

const EMPTY_OPEN_FORM = {
  waiterName: "",
  guestsCount: "2",
  customerId: "",
  notes: "",
};

const TABLE_ICON_OPTIONS = [
  { value: "UtensilsCrossed", label: "Restaurante", icon: UtensilsCrossed },
  { value: "Coffee", label: "Cafe", icon: Coffee },
  { value: "Armchair", label: "Lounge", icon: Armchair },
  { value: "GlassWater", label: "Barra", icon: GlassWater },
  { value: "DoorClosed", label: "Privado", icon: DoorClosed },
  { value: "Store", label: "Terraza", icon: Store },
];

const STATUS_STYLES = {
  free: "border-emerald-200 bg-emerald-50 text-emerald-800",
  waiting_order: "border-amber-200 bg-amber-50 text-amber-800",
  occupied: "border-sky-200 bg-sky-50 text-sky-800",
  order_sent: "border-indigo-200 bg-indigo-50 text-indigo-800",
  preparing: "border-orange-200 bg-orange-50 text-orange-800",
  ready: "border-lime-200 bg-lime-50 text-lime-800",
  waiting_payment: "border-violet-200 bg-violet-50 text-violet-800",
  cleaning: "border-slate-300 bg-slate-100 text-slate-700",
  disabled: "border-rose-200 bg-rose-50 text-rose-800",
  reserved: "border-cyan-200 bg-cyan-50 text-cyan-800",
};

function getIconComponent(iconName) {
  return TABLE_ICON_OPTIONS.find((option) => option.value === iconName)?.icon || UtensilsCrossed;
}

function getUserName(currentUser, userProfile) {
  return userProfile?.display_name || currentUser?.displayName || currentUser?.email || "Mesero";
}

function createDraftLine(product) {
  const lineId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    lineId,
    ...normalizeProductForOrder(product),
  };
}

function getOrderItems(order) {
  return Array.isArray(order?.items) ? order.items : [];
}

function TableStatusBadge({ status }) {
  const visualStatus = normalizeTableStatus(status);
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        STATUS_STYLES[visualStatus] || STATUS_STYLES.free
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {TABLE_STATUS_LABELS[visualStatus] || visualStatus}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

export default function TableManager({
  businessId,
  selectedTableId,
  onSelectTable,
  onNotify,
  onOpenPOS,
  currentUser,
  userProfile,
}) {
  const [tables, setTables] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [kitchenTickets, setKitchenTickets] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeZone, setActiveZone] = useState("all");
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableForm, setTableForm] = useState(EMPTY_TABLE_FORM);
  const [openForm, setOpenForm] = useState(EMPTY_OPEN_FORM);
  const [draftItems, setDraftItems] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [tableDeleteTarget, setTableDeleteTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [transferTargetId, setTransferTargetId] = useState("");
  const [editingTableId, setEditingTableId] = useState("");
  const [modal, setModal] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setTick((current) => current + 1), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribers = [
      subscribeToTables(businessId, (nextTables) => setTables(nextTables.filter((table) => !table.deletedAt))),
      subscribeToActiveTableSessions(businessId, setSessions),
      subscribeToActiveOrders(businessId, setOrders),
      subscribeToKitchenTickets(businessId, setKitchenTickets),
      subscribeToAvailableProducts(businessId, (nextProducts) =>
        setProducts(nextProducts.filter((product) => product.operation?.availableForTables !== false))
      ),
      subscribeToCustomers(businessId, setCustomers),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [businessId]);

  useEffect(() => {
    if (!selectedTable?.id) {
      setEvents([]);
      return undefined;
    }

    const unsubscribe = subscribeToTableEvents(businessId, selectedTable.id, setEvents);
    return () => unsubscribe();
  }, [businessId, selectedTable?.id]);

  useEffect(() => {
    setOpenForm((current) => ({
      ...current,
      waiterName: current.waiterName || getUserName(currentUser, userProfile),
    }));
  }, [currentUser, userProfile]);

  const enrichedTables = useMemo(
    () =>
      tables.map((table) => {
        const session = sessions.find((candidate) => candidate.table_id === table.id || candidate.tableId === table.id);
        const order = orders.find((candidate) => candidate.table_id === table.id || candidate.tableId === table.id);
        const tickets = kitchenTickets.filter((ticket) => ticket.table_id === table.id || ticket.tableId === table.id);
        const visualStatus = getTableVisualStatus(table, session, order, tickets);
        const items = getOrderItems(order);
        return {
          ...table,
          session,
          order,
          kitchenTickets: tickets,
          visualStatus,
          totalItems: calculateItemsCount(items),
          subtotal: calculateOrderTotal(items.filter((item) => item.status !== "canceled")),
          itemsSummary: buildItemsSummary(items),
          alerts: getSessionAlerts({ table, session, order, kitchenTickets: tickets }),
        };
      }),
    [kitchenTickets, orders, sessions, tables, tick]
  );

  const selectedState = useMemo(
    () => enrichedTables.find((table) => table.id === selectedTable?.id) || null,
    [enrichedTables, selectedTable?.id]
  );

  const zones = useMemo(() => {
    const uniqueZones = [...new Set(enrichedTables.map((table) => table.zone || "Salon principal"))];
    return ["all", ...uniqueZones.sort((left, right) => left.localeCompare(right, "es"))];
  }, [enrichedTables]);

  const visibleTables = useMemo(
    () =>
      enrichedTables
        .filter((table) => activeZone === "all" || (table.zone || "Salon principal") === activeZone)
        .sort((left, right) => Number(left.number || 0) - Number(right.number || 0)),
    [activeZone, enrichedTables]
  );

  const categories = useMemo(
    () => ["all", ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "all" || product.category === category;
      const matchesSearch = !search || String(product.name || "").toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [category, productSearch, products]);

  const summary = useMemo(
    () =>
      enrichedTables.reduce(
        (accumulator, table) => {
          accumulator.total += 1;
          if (table.visualStatus === "free") accumulator.free += 1;
          if (["occupied", "waiting_order", "order_sent", "preparing", "ready"].includes(table.visualStatus)) accumulator.occupied += 1;
          if (table.visualStatus === "waiting_payment") accumulator.payment += 1;
          if (table.visualStatus === "cleaning") accumulator.cleaning += 1;
          return accumulator;
        },
        { total: 0, free: 0, occupied: 0, payment: 0, cleaning: 0 }
      ),
    [enrichedTables]
  );

  const draftTotal = calculateOrderTotal(draftItems);
  const activeItems = getOrderItems(selectedState?.order).filter((item) => item.status !== "canceled");
  const activeTotal = calculateOrderTotal(activeItems);
  const selectedCustomer =
    customers.find((customer) => customer.id === openForm.customerId) ||
    customers.find((customer) => customer.id === selectedState?.session?.customer_id) ||
    null;
  const ticketState = selectedCustomer ? getTicketWalletState(selectedCustomer) : null;
  const closeReady = canCloseTable(selectedState?.order);

  const resetOperationalState = () => {
    setDraftItems([]);
    setProductSearch("");
    setCategory("all");
    setFeedback("");
    setCancelTarget(null);
    setCancelReason("");
    setTransferTargetId("");
  };

  const openDetail = (table) => {
    setSelectedTable(table);
    onSelectTable?.(table);
    resetOperationalState();
    if (canOpenTable(table)) {
      setOpenForm({
        ...EMPTY_OPEN_FORM,
        waiterName: getUserName(currentUser, userProfile),
      });
    }
    setModal("detail");
  };

  const openConfig = (table = null) => {
    const rawStatus = String(table?.status || "free");
    const editableStatuses = ["free", "disponible", "reserved", "disabled"];
    setEditingTableId(table?.id || "");
    setTableForm(
      table
        ? {
            number: String(table.number ?? ""),
            name: String(table.name ?? ""),
            code: String(table.code ?? ""),
            zone: String(table.zone || "Salon principal"),
            capacity: String(table.capacity ?? table.seats ?? "4"),
            icon: String(table.icon || "UtensilsCrossed"),
            shape: String(table.shape || "square"),
            size: String(table.size || "md"),
            status: editableStatuses.includes(rawStatus) ? normalizeTableStatus(rawStatus) : rawStatus,
            isActive: table.isActive !== false,
          }
        : EMPTY_TABLE_FORM
    );
    setFeedback("");
    setModal("config");
  };

  const handleSaveTable = async (event) => {
    event.preventDefault();
    setBusy(true);
    setFeedback("");

    try {
      if (editingTableId) {
        await updateTable(editingTableId, businessId, tableForm);
        onNotify?.("Mesa actualizada.");
      } else {
        await createTable(businessId, tableForm);
        onNotify?.("Mesa creada correctamente.");
      }
      setModal("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible guardar la mesa.");
    } finally {
      setBusy(false);
    }
  };

  const handleDisableTable = async () => {
    const tableId = editingTableId || selectedState?.id;
    if (!tableId) return;
    setBusy(true);
    try {
      await disableTable(tableId);
      onNotify?.("Mesa deshabilitada. El historial se conserva.");
      setModal("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible deshabilitar la mesa.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!tableDeleteTarget?.id) return;
    setBusy(true);
    setFeedback("");

    try {
      await deleteTable(tableDeleteTarget.id);
      onNotify?.(`${tableDeleteTarget.name || `Mesa ${tableDeleteTarget.number}`} eliminada definitivamente.`);
      setTableDeleteTarget(null);
      setModal("");
    } catch (error) {
      setTableDeleteTarget(null);
      setFeedback(error instanceof Error ? error.message : "No fue posible eliminar la mesa.");
    } finally {
      setBusy(false);
    }
  };

  const handleOpenSession = async () => {
    if (!selectedState) return;
    setBusy(true);
    setFeedback("");
    try {
      const customer = customers.find((candidate) => candidate.id === openForm.customerId) || null;
      await openTableSession({
        businessId,
        table: selectedState,
        waiter: {
          uid: currentUser?.uid,
          displayName: openForm.waiterName || getUserName(currentUser, userProfile),
        },
        guestsCount: openForm.guestsCount,
        customer,
        notes: openForm.notes,
        createdBy: currentUser,
      });
      onNotify?.("Mesa abierta.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible abrir la mesa.");
    } finally {
      setBusy(false);
    }
  };

  const addDraftItem = (product) => {
    setDraftItems((current) => [...current, createDraftLine(product)]);
  };

  const updateDraftItem = (lineId, updates) => {
    setDraftItems((current) =>
      current.map((item) => {
        if (item.lineId !== lineId) return item;
        const next = { ...item, ...updates };
        next.subtotal = Number(next.quantity || 0) * Number(next.unitPrice || next.price || 0);
        next.note = next.notes || "";
        return next;
      })
    );
  };

  const handleSendOrder = async () => {
    if (!selectedState?.session) {
      setFeedback("Abre la mesa antes de comandar productos.");
      return;
    }
    setBusy(true);
    setFeedback("");
    try {
      await sendOrderToKitchen({
        businessId,
        table: selectedState,
        session: selectedState.session,
        currentOrder: selectedState.order,
        items: draftItems,
        customer: selectedCustomer,
        createdBy: currentUser,
      });
      setDraftItems([]);
      onNotify?.("Pedido enviado a cocina/barra.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible enviar el pedido.");
    } finally {
      setBusy(false);
    }
  };

  const handleKitchenStatus = async (ticket, status) => {
    setBusy(true);
    setFeedback("");
    try {
      await updateKitchenTicketStatus({ businessId, ticket, status, createdBy: currentUser });
      onNotify?.(`Cocina actualizada: ${status}.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible actualizar cocina.");
    } finally {
      setBusy(false);
    }
  };

  const handleRequestBill = async () => {
    if (!selectedState?.order || !selectedState?.session) {
      setFeedback("No hay pedido activo para solicitar cuenta.");
      return;
    }
    if (!closeReady) {
      setFeedback("Entrega o resuelve los items pendientes antes de enviar la cuenta a caja.");
      return;
    }
    setBusy(true);
    setFeedback("");
    try {
      await requestTableBill({
        businessId,
        table: selectedState,
        session: selectedState.session,
        order: selectedState.order,
        createdBy: currentUser,
      });
      const nextTableForPOS = {
        ...selectedState,
        status: "waiting_payment",
        visualStatus: "waiting_payment",
        current_order_id: selectedState.order.id,
        current_session_id: selectedState.session.id,
      };
      onSelectTable?.(nextTableForPOS);
      onNotify?.("Cuenta enviada al POS para cobro.");
      setModal("");
      onOpenPOS?.();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible enviar la cuenta al POS.");
    } finally {
      setBusy(false);
    }
  };

  const handleCancelItem = async () => {
    if (!cancelTarget || !selectedState?.order) return;
    setBusy(true);
    setFeedback("");
    try {
      await cancelOrderItem({
        businessId,
        table: selectedState,
        session: selectedState.session,
        order: selectedState.order,
        lineId: cancelTarget.lineId,
        reason: cancelReason,
        createdBy: currentUser,
      });
      setCancelTarget(null);
      setCancelReason("");
      onNotify?.("Item cancelado con trazabilidad.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible cancelar el item.");
    } finally {
      setBusy(false);
    }
  };

  const handleReleaseTable = async () => {
    if (!selectedState) return;
    setBusy(true);
    try {
      await releaseCleanTable({ businessId, table: selectedState, createdBy: currentUser });
      onNotify?.("Mesa limpia y libre.");
      setModal("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible liberar la mesa.");
    } finally {
      setBusy(false);
    }
  };

  const handleReassignWaiter = async () => {
    if (!selectedState?.session) return;
    setBusy(true);
    try {
      await reassignWaiter({
        businessId,
        table: selectedState,
        session: selectedState.session,
        waiter: { uid: currentUser?.uid, displayName: openForm.waiterName },
        createdBy: currentUser,
      });
      onNotify?.("Mesero reasignado.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible reasignar mesero.");
    } finally {
      setBusy(false);
    }
  };

  const handleTransfer = async () => {
    const targetTable = enrichedTables.find((table) => table.id === transferTargetId);
    if (!selectedState?.session || !targetTable) return;
    if (!canTransferTable(selectedState, targetTable)) {
      setFeedback("Selecciona una mesa destino libre.");
      return;
    }
    setBusy(true);
    try {
      await transferTableSession({
        businessId,
        sourceTable: selectedState,
        targetTable,
        session: selectedState.session,
        order: selectedState.order,
        createdBy: currentUser,
      });
      onNotify?.("Sesion transferida.");
      setModal("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible transferir la mesa.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="grid gap-5">
      <div className="rounded-[28px] bg-white p-5 shadow-lg ring-1 ring-slate-200 xl:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Salon / Mesas / Pedidos</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Centro operativo para abrir mesas, comandar productos, seguir cocina, cobrar y liberar con trazabilidad.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openConfig()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={17} />
            Nueva mesa
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Total", summary.total, "bg-slate-50 text-slate-700 ring-slate-200"],
            ["Libres", summary.free, "bg-emerald-50 text-emerald-800 ring-emerald-200"],
            ["En atencion", summary.occupied, "bg-sky-50 text-sky-800 ring-sky-200"],
            ["Por cobrar", summary.payment, "bg-violet-50 text-violet-800 ring-violet-200"],
            ["Limpieza", summary.cleaning, "bg-slate-100 text-slate-700 ring-slate-300"],
          ].map(([label, value, classes]) => (
            <article key={label} className={`rounded-[22px] p-4 ring-1 ${classes}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-75">{label}</p>
              <p className="mt-2 text-2xl font-black">{value}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] bg-white p-5 shadow-lg ring-1 ring-slate-200 xl:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <LayoutGrid size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Mapa operativo</h3>
              <p className="text-sm text-slate-500">Filtra por zona y toca una mesa para operar.</p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {zones.map((zone) => (
              <button
                key={zone}
                type="button"
                onClick={() => setActiveZone(zone)}
                className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  activeZone === zone
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {zone === "all" ? "Todas" : zone}
              </button>
            ))}
          </div>
        </div>

        <div className="grid auto-rows-[260px] gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {visibleTables.map((table) => {
            const Icon = getIconComponent(table.icon);
            const isSelected = selectedTableId === table.id;
            const elapsed = table.session ? formatDuration(calculateTableDuration(table.session)) : "";
            return (
              <article
                key={table.id}
                className={`relative flex h-[260px] flex-col rounded-[26px] border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                  isSelected ? "border-emerald-400 ring-2 ring-emerald-200" : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => openDetail(table)}
                  className="absolute inset-0 rounded-[26px]"
                  aria-label={`Abrir ${table.name || `Mesa ${table.number}`}`}
                />
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-base font-semibold text-slate-950">
                          {table.name || `Mesa ${table.number}`}
                        </h4>
                        <p className="truncate text-xs text-slate-500">{table.zone || "Salon principal"}</p>
                      </div>
                    </div>
                  </div>
                  <TableStatusBadge status={table.visualStatus} />
                </div>

                <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-slate-50 px-3 py-3 ring-1 ring-slate-200">
                    <UsersRound size={15} className="text-slate-400" />
                    <p className="mt-2 text-lg font-black text-slate-900">{table.session?.guestsCount || table.guests_count || table.capacity}</p>
                    <p className="text-[11px] text-slate-500">personas</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-3 ring-1 ring-slate-200">
                    <ReceiptText size={15} className="text-slate-400" />
                    <p className="mt-2 text-lg font-black text-slate-900">{table.totalItems}</p>
                    <p className="text-[11px] text-slate-500">items</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-3 ring-1 ring-slate-200">
                    <Clock3 size={15} className="text-slate-400" />
                    <p className="mt-2 text-sm font-black text-slate-900">{elapsed || "-"}</p>
                    <p className="text-[11px] text-slate-500">tiempo</p>
                  </div>
                </div>

                <div className="relative z-10 mt-4 min-h-0 flex-1">
                  <p className="line-clamp-2 text-sm leading-5 text-slate-500">
                    {table.itemsSummary.text || (table.visualStatus === "free" ? "Disponible para abrir atencion." : "Pendiente de registrar productos.")}
                  </p>
                  {table.session?.waiterName || table.session?.waiter_name ? (
                    <p className="mt-2 truncate text-xs font-semibold text-slate-600">
                      Mesero: {table.session.waiterName || table.session.waiter_name}
                    </p>
                  ) : null}
                </div>

                <div className="relative z-10 mt-3 flex items-center justify-between gap-2">
                  <p className="text-base font-black text-slate-950">{formatCOP(table.subtotal || table.current_total || 0)}</p>
                  <div className="flex min-w-0 gap-1">
                    {table.alerts.slice(0, 2).map((alert) => (
                      <span key={alert.label} className="truncate rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                        {alert.label}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}

          <button
            type="button"
            onClick={() => openConfig()}
            className="flex h-[260px] flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-slate-400 hover:bg-white"
          >
            <Plus size={28} />
            <span className="mt-3 text-sm font-semibold">Crear mesa</span>
          </button>
        </div>
      </div>

      <ModalWrapper
        open={modal === "config"}
        onClose={() => setModal("")}
        title={editingTableId ? "Editar mesa" : "Configurar mesa"}
        description="Gestiona mesa fisica, zona, capacidad, forma y estado sin borrar historial operativo."
        icon={{ main: <Pencil size={20} />, close: <X size={18} /> }}
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={handleSaveTable} className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Numero">
              <input required type="number" min="1" name="number" value={tableForm.number} onChange={(event) => setTableForm((current) => ({ ...current, number: event.target.value }))} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200" />
            </Field>
            <Field label="Nombre">
              <input required name="name" value={tableForm.name} onChange={(event) => setTableForm((current) => ({ ...current, name: event.target.value }))} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200" />
            </Field>
            <Field label="Zona">
              <input required name="zone" value={tableForm.zone} onChange={(event) => setTableForm((current) => ({ ...current, zone: event.target.value }))} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200" />
            </Field>
            <Field label="Capacidad">
              <input required type="number" min="1" name="capacity" value={tableForm.capacity} onChange={(event) => setTableForm((current) => ({ ...current, capacity: event.target.value }))} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200" />
            </Field>
            <Field label="Codigo opcional">
              <input name="code" value={tableForm.code} onChange={(event) => setTableForm((current) => ({ ...current, code: event.target.value }))} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200" />
            </Field>
            <Field label="Icono">
              <select name="icon" value={tableForm.icon} onChange={(event) => setTableForm((current) => ({ ...current, icon: event.target.value }))} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200">
                {TABLE_ICON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Forma">
              <select name="shape" value={tableForm.shape} onChange={(event) => setTableForm((current) => ({ ...current, shape: event.target.value }))} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200">
                <option value="square">Cuadrada</option>
                <option value="round">Redonda</option>
                <option value="rectangle">Rectangular</option>
              </select>
            </Field>
            <Field label="Estado">
              <select name="status" value={tableForm.status} onChange={(event) => setTableForm((current) => ({ ...current, status: event.target.value, isActive: event.target.value !== "disabled" }))} className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200">
                {!["free", "reserved", "disabled"].includes(tableForm.status) ? (
                  <option value={tableForm.status}>Mantener estado operativo</option>
                ) : null}
                <option value="free">Activa / libre</option>
                <option value="reserved">Reservada</option>
                <option value="disabled">Fuera de servicio</option>
              </select>
            </Field>
          </div>

          {feedback ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{feedback}</div> : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            {editingTableId ? (
              <button type="button" onClick={handleDisableTable} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 disabled:opacity-50">
                <X size={16} />
                Deshabilitar
              </button>
            ) : null}
            {editingTableId ? (
              <button
                type="button"
                onClick={() =>
                  setTableDeleteTarget(
                    tables.find((table) => table.id === editingTableId) || {
                      id: editingTableId,
                      name: tableForm.name,
                      number: tableForm.number,
                    }
                  )
                }
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 disabled:opacity-50"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            ) : null}
            <button type="button" onClick={() => setModal("")} className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">Cancelar</button>
            <button type="submit" disabled={busy} className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Guardando..." : "Guardar mesa"}</button>
          </div>
        </form>
      </ModalWrapper>

      <ModalWrapper
        open={modal === "detail" && Boolean(selectedState)}
        onClose={() => setModal("")}
        title={selectedState?.name || `Mesa ${selectedState?.number || ""}`}
        description={`${selectedState?.zone || "Salon principal"} · ${selectedState?.capacity || 0} puestos`}
        icon={{ main: <UtensilsCrossed size={20} />, close: <X size={18} /> }}
        maxWidthClass="max-w-7xl"
      >
        {selectedState ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
            <div className="grid gap-5">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs text-slate-500">Estado</p>
                  <div className="mt-2"><TableStatusBadge status={selectedState.visualStatus} /></div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs text-slate-500">Tiempo mesa</p>
                  <p className="mt-2 text-lg font-black text-slate-950">{selectedState.session ? formatDuration(calculateTableDuration(selectedState.session)) : "-"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs text-slate-500">Items</p>
                  <p className="mt-2 text-lg font-black text-slate-950">{calculateItemsCount(activeItems)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="mt-2 text-lg font-black text-slate-950">{formatCOP(activeTotal + draftTotal)}</p>
                </div>
              </div>

              {canOpenTable(selectedState) ? (
                <div className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
                  <h4 className="font-semibold text-slate-950">Abrir atencion</h4>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Field label="Mesero">
                      <input value={openForm.waiterName} onChange={(event) => setOpenForm((current) => ({ ...current, waiterName: event.target.value }))} className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200" />
                    </Field>
                    <Field label="Personas">
                      <input type="number" min="1" value={openForm.guestsCount} onChange={(event) => setOpenForm((current) => ({ ...current, guestsCount: event.target.value }))} className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200" />
                    </Field>
                    <Field label="Cliente opcional">
                      <select value={openForm.customerId} onChange={(event) => setOpenForm((current) => ({ ...current, customerId: event.target.value }))} className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200">
                        <option value="">Cliente ocasional</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>{customer.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Observacion">
                      <input value={openForm.notes} onChange={(event) => setOpenForm((current) => ({ ...current, notes: event.target.value }))} className="rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-slate-200" />
                    </Field>
                  </div>
                  <button type="button" onClick={handleOpenSession} disabled={busy} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                    <CheckCircle2 size={17} />
                    Abrir mesa
                  </button>
                </div>
              ) : null}

              {selectedState.visualStatus === "cleaning" ? (
                <button type="button" onClick={handleReleaseTable} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-4 text-sm font-semibold text-white disabled:opacity-50">
                  <Eraser size={17} />
                  Marcar como limpia y liberar
                </button>
              ) : null}

              {selectedState.session ? (
                <div className="grid gap-5">
                  <div className="rounded-[24px] bg-white p-5 ring-1 ring-slate-200">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-950">Toma de pedido</h4>
                        <p className="text-sm text-slate-500">Usa el catalogo existente; no se crea carta paralela.</p>
                      </div>
                      {ticketState?.isActive ? (
                        <span className="rounded-full bg-[#fff7df] px-3 py-1 text-xs font-semibold text-[#7a5200] ring-1 ring-[#d4a72c]/30">
                          Tiquetera activa: {ticketState.balance}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                      <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                        <Search size={16} className="text-slate-400" />
                        <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Buscar producto..." className="w-full bg-transparent text-sm outline-none" />
                      </div>
                      <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-slate-200">
                        {categories.map((item) => (
                          <option key={item} value={item}>{item === "all" ? "Todas las categorias" : item}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-4 grid max-h-[280px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                      {filteredProducts.map((product) => (
                        <button key={product.id} type="button" onClick={() => addDraftItem(product)} className="rounded-2xl bg-slate-50 p-4 text-left ring-1 ring-slate-200 transition hover:bg-white hover:ring-emerald-300">
                          <p className="line-clamp-2 text-sm font-semibold text-slate-900">{product.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{product.category || "Sin categoria"}</p>
                          <p className="mt-3 text-base font-black text-slate-950">{formatCOP(product.price || 0)}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-semibold text-slate-950">Pedido activo</h4>
                      <span className="text-sm font-black text-slate-950">{formatCOP(activeTotal + draftTotal)}</span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {activeItems.map((item) => (
                        <article key={item.lineId || item.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{item.productName || item.name}</p>
                              <p className="text-sm text-slate-500">{item.quantity} x {formatCOP(item.unitPrice ?? item.price ?? 0)} · {item.status || "sent"}</p>
                              {item.notes || item.note ? <p className="mt-1 text-xs text-slate-500">Nota: {item.notes || item.note}</p> : null}
                            </div>
                            {canCancelItem(item) ? (
                              <button type="button" onClick={() => setCancelTarget(item)} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                                Cancelar
                              </button>
                            ) : null}
                          </div>
                        </article>
                      ))}

                      {draftItems.map((item) => (
                        <article key={item.lineId} className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-amber-950">{item.productName}</p>
                              <p className="text-sm text-amber-800">Borrador · {formatCOP(item.unitPrice)}</p>
                            </div>
                            <button type="button" onClick={() => setDraftItems((current) => current.filter((candidate) => candidate.lineId !== item.lineId))} className="text-rose-700">
                              <X size={16} />
                            </button>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                            <input type="number" min="1" value={item.quantity} onChange={(event) => updateDraftItem(item.lineId, { quantity: Number(event.target.value || 1) })} className="rounded-2xl bg-white px-3 py-2 text-sm outline-none ring-1 ring-amber-200" />
                            <input value={item.notes} onChange={(event) => updateDraftItem(item.lineId, { notes: event.target.value, note: event.target.value })} placeholder="Notas cocina/barra" className="rounded-2xl bg-white px-3 py-2 text-sm outline-none ring-1 ring-amber-200" />
                          </div>
                          {selectedCustomer && item.ticket_eligible ? (
                            <button type="button" onClick={() => updateDraftItem(item.lineId, { useTicket: !item.useTicket })} className={`mt-3 rounded-2xl px-3 py-2 text-xs font-semibold ${item.useTicket ? "bg-[#fff7df] text-[#7a5200] ring-1 ring-[#d4a72c]/30" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
                              {item.useTicket ? "Ticket aplicado" : "Usar ticket"}
                            </button>
                          ) : null}
                        </article>
                      ))}

                      {activeItems.length === 0 && draftItems.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                          Aun no hay productos en esta mesa.
                        </div>
                      ) : null}
                    </div>

                    <button type="button" onClick={handleSendOrder} disabled={busy || draftItems.length === 0} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fff7df] px-4 py-3 text-sm font-semibold text-[#7a5200] ring-1 ring-[#d4a72c]/30 disabled:opacity-50">
                      <Send size={17} />
                      Enviar a cocina/barra
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="grid content-start gap-5">
              <div className="rounded-[24px] bg-[linear-gradient(180deg,#0f172a_0%,#1f2937_100%)] p-5 text-white">
                <h4 className="font-semibold">Acciones de mesa</h4>
                <div className="mt-4 grid gap-3">
                  <button type="button" onClick={() => openConfig(selectedState)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10">
                    <Pencil size={16} />
                    Editar mesa fisica
                  </button>
                  {selectedState.session ? (
                    <>
                      <div className="grid gap-2">
                        <label className="text-xs uppercase tracking-[0.16em] text-slate-400">Mesero</label>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                          <input value={openForm.waiterName} onChange={(event) => setOpenForm((current) => ({ ...current, waiterName: event.target.value }))} className="rounded-2xl bg-slate-900 px-3 py-2 text-sm outline-none ring-1 ring-white/10" />
                          <button type="button" onClick={handleReassignWaiter} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-semibold">
                            OK
                          </button>
                        </div>
                      </div>
                      <button type="button" onClick={handleRequestBill} disabled={busy || !selectedState.order} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                        <HandCoins size={16} />
                        Solicitar cuenta
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {selectedState.kitchenTickets.length > 0 ? (
                <div className="rounded-[24px] bg-white p-5 ring-1 ring-slate-200">
                  <h4 className="flex items-center gap-2 font-semibold text-slate-950">
                    <ChefHat size={18} />
                    Cocina / barra
                  </h4>
                  <div className="mt-4 space-y-3">
                    {selectedState.kitchenTickets.map((ticket) => (
                      <article key={ticket.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">{ticket.items?.length || 0} linea(s)</p>
                          <TableStatusBadge status={ticket.status === "pending" ? "order_sent" : ticket.status} />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">{buildItemsSummary(ticket.items || []).text}</p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <button type="button" onClick={() => handleKitchenStatus(ticket, "preparing")} disabled={busy || ticket.status !== "pending"} className="rounded-xl bg-orange-50 px-2 py-2 text-xs font-semibold text-orange-700 ring-1 ring-orange-200 disabled:opacity-40">Preparar</button>
                          <button type="button" onClick={() => handleKitchenStatus(ticket, "ready")} disabled={busy || !["pending", "preparing"].includes(ticket.status)} className="rounded-xl bg-lime-50 px-2 py-2 text-xs font-semibold text-lime-700 ring-1 ring-lime-200 disabled:opacity-40">Listo</button>
                          <button type="button" onClick={() => handleKitchenStatus(ticket, "delivered")} disabled={busy || ticket.status !== "ready"} className="rounded-xl bg-sky-50 px-2 py-2 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 disabled:opacity-40">Entregar</button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedState.session ? (
                <div className="rounded-[24px] bg-white p-5 ring-1 ring-slate-200">
                  <h4 className="font-semibold text-slate-950">Enviar a caja</h4>
                  <div className="mt-4 grid gap-3">
                    <p className="text-sm leading-6 text-slate-500">
                      Salón prepara y valida la cuenta. El POS registra el pago, caja, cartera, ticketera e inventario financiero.
                    </p>
                    <button type="button" onClick={handleRequestBill} disabled={busy || !selectedState.order} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                      <HandCoins size={16} />
                      Cobrar en POS
                    </button>
                    {!closeReady && selectedState.order ? (
                      <p className="text-xs leading-5 text-amber-700">Antes de enviar a caja, entrega o resuelve los items pendientes/listos.</p>
                    ) : null}
                    {selectedState.visualStatus === "waiting_payment" ? (
                      <p className="text-xs leading-5 text-violet-700">Esta cuenta ya esta esperando pago en POS.</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {selectedState.session ? (
                <div className="rounded-[24px] bg-white p-5 ring-1 ring-slate-200">
                  <h4 className="font-semibold text-slate-950">Transferir mesa</h4>
                  <div className="mt-3 grid gap-3">
                    <select value={transferTargetId} onChange={(event) => setTransferTargetId(event.target.value)} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-slate-200">
                      <option value="">Mesa destino libre</option>
                      {enrichedTables.filter((table) => table.id !== selectedState.id && canOpenTable(table)).map((table) => (
                        <option key={table.id} value={table.id}>{table.name || `Mesa ${table.number}`}</option>
                      ))}
                    </select>
                    <button type="button" onClick={handleTransfer} disabled={busy || !transferTargetId} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Transferir</button>
                  </div>
                </div>
              ) : null}

              <div className="rounded-[24px] bg-white p-5 ring-1 ring-slate-200">
                <h4 className="font-semibold text-slate-950">Historial breve</h4>
                <div className="mt-4 space-y-3">
                  {events.slice(0, 6).map((event) => (
                    <div key={event.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <p className="font-semibold text-slate-800">{event.description}</p>
                      <p className="mt-1 text-xs text-slate-400">{event.createdByName || event.created_by || "Sistema"}</p>
                    </div>
                  ))}
                  {events.length === 0 ? <p className="text-sm text-slate-500">Sin eventos registrados todavia.</p> : null}
                </div>
              </div>

              {feedback ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{feedback}</div> : null}
            </aside>
          </div>
        ) : null}
      </ModalWrapper>

      <ConfirmModal
        open={Boolean(cancelTarget)}
        title="Cancelar item"
        description={cancelTarget ? `Indica el motivo para cancelar ${cancelTarget.productName || cancelTarget.name}. No se borrara el historial.` : ""}
        confirmLabel="Cancelar item"
        onConfirm={handleCancelItem}
        onCancel={() => {
          setCancelTarget(null);
          setCancelReason("");
        }}
      >
        <textarea
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          rows="3"
          placeholder="Motivo obligatorio..."
          className="mt-4 w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none ring-1 ring-slate-200"
        />
      </ConfirmModal>

      <ConfirmModal
        open={Boolean(tableDeleteTarget)}
        title="Eliminar mesa"
        description={
          tableDeleteTarget
            ? `Se eliminara definitivamente ${tableDeleteTarget.name || `Mesa ${tableDeleteTarget.number}`}. Esta accion solo funciona si la mesa no tiene historial operativo.`
            : ""
        }
        confirmLabel="Eliminar definitivamente"
        onConfirm={handleDeleteTable}
        onCancel={() => setTableDeleteTarget(null)}
      />
    </section>
  );
}
