import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { getTicketWalletState, subscribeToCustomers } from "../services/customerService";
import { subscribeToProducts } from "../services/productService";
import { subscribeToTables } from "../services/tableService";
import {
  getCashSessionLockInfo,
  subscribeToOpenCashSession,
} from "../services/cashClosingService";
import {
  cancelOrder,
  requestPayment,
  submitOrder,
  subscribeToActiveOrder,
} from "../services/orderService";
import ConfirmModal from "./ConfirmModal";
import ModalWrapper from "./ModalWrapper";
import { formatCOP } from "../utils/formatters";
import { QUICK_SALE_TABLE } from "../utils/posConstants";
import { PAYMENT_METHOD_LABELS } from "../utils/payments";
import { buildCashTenderSuggestions, calculateCashChange } from "../utils/cashPayment";

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
  { value: "nequi", label: "Nequi" },
  { value: "daviplata", label: "Daviplata" },
];

const CATEGORY_STYLES = {
  bebidas: "from-sky-100 to-cyan-50 text-sky-900",
  cafe: "from-amber-100 to-orange-50 text-amber-950",
  cafetera: "from-amber-100 to-orange-50 text-amber-950",
  panaderia: "from-yellow-100 to-amber-50 text-amber-950",
  postres: "from-pink-100 to-rose-50 text-rose-900",
  almuerzos: "from-emerald-100 to-lime-50 text-emerald-900",
  comida: "from-emerald-100 to-lime-50 text-emerald-900",
};

function getCategoryStyle(category) {
  const key = String(category || "").trim().toLowerCase();
  return CATEGORY_STYLES[key] || "from-slate-100 to-slate-50 text-slate-900";
}

function createSplitPaymentLine(method = "cash", amount = "") {
  return {
    id: `split-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    method,
    amount,
  };
}

function getPosOperationStatus({ selectedTable, activeOrder, cartItems }) {
  if (!selectedTable) {
    return {
      label: "Pendiente por iniciar",
      detail: "Selecciona una mesa o usa venta rapida para empezar a cobrar.",
    };
  }

  if (selectedTable.isQuickSale) {
    return {
      label: "Modo caja rapida",
      detail: "Puedes cobrar de inmediato sin comandar la orden.",
    };
  }

  if (activeOrder?.id) {
    return {
      label: "Orden en curso",
      detail: "La comanda ya existe y esta lista para seguimiento o cobro.",
    };
  }

  if (cartItems.length > 0) {
    return {
      label: "Borrador listo",
      detail: "La mesa ya tiene productos cargados y puede pasar a comanda.",
    };
  }

  return {
    label: "Mesa lista",
    detail: "Agrega productos para comenzar la venta.",
  };
}

function getOrderedItemsLabel(order) {
  const names = (order?.items || [])
    .map((item) => String(item.name || "").trim())
    .filter(Boolean);

  if (!names.length) {
    return "";
  }

  return names.slice(0, 3).join(", ");
}

function getPaymentReadiness({
  selectedTable,
  cartItems,
  activeOrder,
  paymentMethod,
  chargedTotal,
  cashShortage,
  cashLockInfo,
}) {
  if (cashLockInfo?.blocked) {
    return {
      label: "Caja bloqueada",
      detail: "Debes resolver la caja antes de registrar nuevos cobros.",
      tone: "text-rose-200",
    };
  }

  if (!selectedTable) {
    return {
      label: "Falta asignar la venta",
      detail: "Selecciona una mesa o venta rapida para continuar.",
      tone: "text-slate-300",
    };
  }

  if (!activeOrder?.id && cartItems.length === 0) {
    return {
      label: "Sin productos en el pedido",
      detail: "Agrega productos antes de intentar cobrar.",
      tone: "text-slate-300",
    };
  }

  if (chargedTotal <= 0) {
    return {
      label: "Valor pendiente por definir",
      detail: "Indica el valor final cobrado para continuar.",
      tone: "text-amber-200",
    };
  }

  if (paymentMethod === "cash" && cashShortage > 0) {
    return {
      label: "Falta efectivo por recibir",
      detail: `Aun faltan ${formatCOP(cashShortage)} para cerrar este cobro en efectivo.`,
      tone: "text-amber-200",
    };
  }

  if (paymentMethod === "cash" && cashShortage === 0) {
    return {
      label: "Listo para cobrar en efectivo",
      detail: "El pago recibido cubre el total y el cambio ya esta calculado.",
      tone: "text-emerald-200",
    };
  }

  return {
    label: "Listo para registrar el cobro",
    detail: "Puedes confirmar el pago o dividirlo desde el modal.",
    tone: "text-emerald-200",
  };
}

function SearchSelector({
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

function CartPanel({
  selectedTable,
  selectedCustomer,
  selectedCustomerTicketState,
  customers,
  setSelectedCustomer,
  cartItems,
  subtotal,
  ticketCoveredAmount,
  payableSubtotal,
  chargedTotalInput,
  setChargedTotalInput,
  chargedTotal,
  cashReceivedInput,
  setCashReceivedInput,
  cashChange,
  cashShortage,
  cashSuggestions,
  adjustmentAmount,
  adjustmentPct,
  debtAmount,
  cartNotice,
  cashLockInfo,
  paymentMethod,
  setPaymentMethod,
  canUseSplitPayment,
  loading,
  activeOrder,
  updateItem,
  removeItem,
  handleCommand,
  handlePay,
  handleTicketPay,
  handleOpenCancel,
  onClose,
  mobile = false,
}) {
  const chargedTotalId = useId();
  const cashReceivedId = useId();
  const itemCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const ticketUnits = cartItems.reduce(
    (sum, item) => sum + (item.useTicket ? Number(item.quantity || 0) : 0),
    0
  );
  const adjustmentLabel =
    adjustmentAmount < 0 ? "Descuento aplicado" : adjustmentAmount > 0 ? "Aumento aplicado" : "Sin ajuste";
  const isCashPayment = paymentMethod === "cash";
  const operationStatus = getPosOperationStatus({ selectedTable, activeOrder, cartItems });
  const paymentReadiness = getPaymentReadiness({
    selectedTable,
    cartItems,
    activeOrder,
    paymentMethod,
    chargedTotal,
    cashShortage,
    cashLockInfo,
  });

  return (
    <div
      className={`rounded-[28px] bg-[linear-gradient(180deg,#0f172a_0%,#1f2937_100%)] p-6 text-white shadow-lg ${
        mobile ? "h-full rounded-none" : ""
      }`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Carrito de pedido</h2>
          <p className="text-sm text-slate-300">
            {selectedTable
              ? selectedTable.isQuickSale
                ? "Venta rapida lista para pago inmediato."
                : `Tomando orden para ${selectedTable.name || `Mesa ${selectedTable.number}`}.`
              : "Selecciona una mesa para empezar."}
          </p>
        </div>

        {mobile ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-slate-300"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      <div className="mb-4">
        <SearchSelector
          label="Cliente"
          placeholder="Cliente ocasional"
          items={customers}
          selectedItem={selectedCustomer}
          onSelectItem={setSelectedCustomer}
          getLabel={(customer) => {
            const ticketState = getTicketWalletState(customer);
            return `${customer.name}${ticketState.balance ? ` · Tickets ${ticketState.balance}` : ""}`;
          }}
          getDescription={(customer) =>
            `${customer.phone || "Sin telefono"} · Deuda ${formatCOP(customer.debt_balance || 0)}`
          }
          icon={UserRound}
        />
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Estado operativo
          </p>
          <p className="mt-2 text-sm font-semibold text-white">{operationStatus.label}</p>
          <p className="mt-1 text-xs text-slate-300">{operationStatus.detail}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Venta actual
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-2xl bg-slate-950/60 px-2 py-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Items</p>
              <p className="mt-1 text-base font-semibold text-white">{itemCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-950/60 px-2 py-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Tickets</p>
              <p className="mt-1 text-base font-semibold text-white">{ticketUnits}</p>
            </div>
            <div className="col-span-2 rounded-2xl bg-slate-950/60 px-3 py-2 text-left">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Cliente</p>
              <p className="mt-1 truncate text-sm font-semibold text-white">
                {selectedCustomer ? "Asignado" : "Ocasional"}
              </p>
            </div>
          </div>
        </article>
      </div>

      <div className="space-y-3">
        {cartItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
            No hay productos agregados todavia.
          </div>
        ) : (
          cartItems.map((item) => (
            <article
              key={item.lineId}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-xs text-slate-400">
                    {item.useTicket
                      ? `Tiquetera aplicada · ${item.quantity} ticket(s)`
                      : `${formatCOP(item.price)} x ${item.quantity}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.lineId)}
                  className="text-xs font-medium text-rose-300"
                >
                  Quitar
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full border border-slate-700 px-2 py-1 text-sm"
                  onClick={() =>
                    updateItem(item.lineId, {
                      quantity: Math.max(1, (item.quantity || 1) - 1),
                    })
                  }
                >
                  -
                </button>
                <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                <button
                  type="button"
                  className="rounded-full border border-slate-700 px-2 py-1 text-sm"
                  onClick={() =>
                    updateItem(item.lineId, {
                      quantity: (item.quantity || 1) + 1,
                    })
                  }
                >
                  +
                </button>
              </div>

              <textarea
                rows="2"
                value={item.note || ""}
                onChange={(event) => updateItem(item.lineId, { note: event.target.value })}
                placeholder="Notas para cocina o barra..."
                className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
              />
              {selectedCustomerTicketState?.isActive && item.ticket_eligible ? (
                <button
                  type="button"
                  onClick={() => updateItem(item.lineId, { useTicket: !item.useTicket })}
                  className={`mt-3 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                    item.useTicket
                      ? "bg-[#fff7df] text-[#7a5200] ring-1 ring-[#d4a72c]/30"
                      : "bg-slate-800 text-emerald-200 ring-1 ring-emerald-400/20"
                  }`}
                >
                  {item.useTicket ? "Ticket aplicado" : "Usar ticket"}
                </button>
              ) : null}
            </article>
          ))
        )}
      </div>

      <div className="mt-6 border-t border-slate-800 pt-4">
        {cartNotice ? (
          <div className="mb-4 rounded-2xl bg-amber-500/10 px-4 py-3 text-xs text-amber-100 ring-1 ring-amber-400/20">
            {cartNotice}
          </div>
        ) : null}

        {selectedCustomer && selectedCustomerTicketState?.lowBalance ? (
          <div className="mb-4 rounded-2xl bg-amber-500/10 px-4 py-3 text-xs text-amber-100 ring-1 ring-amber-400/20">
            Aviso: ultimos {selectedCustomerTicketState.balance} almuerzos disponibles. Sugerir renovacion.
          </div>
        ) : null}

        {cashLockInfo?.blocked ? (
          <div className="mb-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-xs text-rose-200 ring-1 ring-rose-400/20">
            {cashLockInfo.message}
          </div>
        ) : null}

        <div className="mb-4 rounded-[24px] border border-emerald-400/15 bg-gradient-to-r from-emerald-500/15 via-emerald-400/8 to-white/5 px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Centro de cobro
              </p>
              <p className="mt-2 text-2xl font-black text-white">{formatCOP(chargedTotal)}</p>
              <p className={`mt-2 text-sm font-medium ${paymentReadiness.tone}`}>
                {paymentReadiness.label}
              </p>
              <p className="mt-1 text-xs text-slate-300">{paymentReadiness.detail}</p>
            </div>
            <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Metodo actual</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Total real de productos</span>
            <span>{formatCOP(subtotal)}</span>
          </div>
          {ticketCoveredAmount > 0 ? (
            <div className="flex items-center justify-between text-sm text-amber-200">
              <span>Cubierto por tiquetera</span>
              <span>-{formatCOP(ticketCoveredAmount)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between text-sm text-slate-200">
            <span>Total a cobrar</span>
            <span className="font-semibold">{formatCOP(payableSubtotal)}</span>
          </div>
          <div className="grid gap-2">
            <label htmlFor={chargedTotalId} className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Valor final cobrado
            </label>
            <input
              id={chargedTotalId}
              type="number"
              min="0"
              step="1"
              value={chargedTotalInput}
              onChange={(event) => setChargedTotalInput(event.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
            />
          </div>
          {isCashPayment && chargedTotal > 0 ? (
            <div className="grid gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
              <div className="grid gap-2">
                <label
                  htmlFor={cashReceivedId}
                  className="text-xs uppercase tracking-[0.18em] text-emerald-200"
                >
                  Pago recibido del cliente
                </label>
                <input
                  id={cashReceivedId}
                  type="number"
                  min="0"
                  step="1"
                  value={cashReceivedInput}
                  onChange={(event) => setCashReceivedInput(event.target.value)}
                  className="rounded-2xl border border-emerald-400/20 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {cashSuggestions.map((amount) => (
                  <button
                    key={`cash-suggestion-${amount}`}
                    type="button"
                    onClick={() => setCashReceivedInput(String(amount))}
                    className="rounded-full border border-emerald-400/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-white/15"
                  >
                    {amount === chargedTotal ? "Exacto" : formatCOP(amount)}
                  </button>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-950/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Cambio</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-200">
                    {formatCOP(cashChange)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-950/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Falta por recibir
                  </p>
                  <p className="mt-1 text-lg font-semibold text-amber-200">
                    {formatCOP(cashShortage)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">{adjustmentLabel}</span>
            <span
              className={
                adjustmentAmount < 0
                  ? "font-semibold text-amber-300"
                  : adjustmentAmount > 0
                    ? "font-semibold text-emerald-300"
                    : "font-semibold text-slate-200"
              }
            >
              {formatCOP(adjustmentAmount)} ({adjustmentPct.toFixed(1)}%)
            </span>
          </div>
        {selectedCustomer && debtAmount > 0 ? (
          <div className="rounded-2xl bg-rose-500/10 px-3 py-2 text-xs text-rose-200 ring-1 ring-rose-400/20">
            Se cargaran {formatCOP(debtAmount)} como deuda a {selectedCustomer.name}.
          </div>
        ) : null}
        {canUseSplitPayment && payableSubtotal > 0 ? (
          <div className="rounded-2xl bg-sky-500/10 px-3 py-2 text-xs text-sky-100 ring-1 ring-sky-400/20">
            SmartProfit puede dividir este cobro entre varios metodos desde el modal de pago.
          </div>
        ) : null}
      </div>

        <div className="mb-5 mt-5">
          {selectedCustomer && selectedCustomerTicketState?.isActive && payableSubtotal === 0 && ticketCoveredAmount > 0 ? (
            <button
              type="button"
              onClick={handleTicketPay}
              disabled={loading || !selectedTable || (!activeOrder?.id && cartItems.length === 0)}
              className="mb-4 w-full rounded-2xl border border-[#d4a72c]/30 bg-[#fff7df] px-4 py-3 text-sm font-semibold text-[#7a5200] transition hover:bg-[#fde9a8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Pagar con Ticket (Saldo: {selectedCustomerTicketState.balance})
            </button>
          ) : null}

          <p className="mb-3 text-sm text-slate-300">Metodo de pago</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {PAYMENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPaymentMethod(option.value)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                  paymentMethod === option.value
                    ? "border-emerald-400 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-950/20"
                    : "border-emerald-900/30 bg-white/5 text-slate-200 hover:border-emerald-400/40"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={handleCommand}
            disabled={loading || !selectedTable || cartItems.length === 0 || selectedTable?.isQuickSale}
            className="rounded-2xl border border-[#d4a72c]/30 bg-[#fff7df] px-4 py-3 text-sm font-semibold text-[#7a5200] transition hover:bg-[#fde9a8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {selectedTable?.isQuickSale ? "Venta inmediata" : "Comandar"}
          </button>

          <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
          <button
            type="button"
            onClick={handlePay}
              disabled={
                loading ||
                !selectedTable ||
                cashLockInfo?.blocked ||
                (!activeOrder?.id && cartItems.length === 0)
              }
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/25 transition hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cobrar ahora
            </button>
            <button
              type="button"
              onClick={handleOpenCancel}
              disabled={loading || !selectedTable || !activeOrder?.id}
              className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar orden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function POSOrder({
  businessId,
  selectedTable,
  onSelectTable,
  onOrderPaid,
  onOrderCancelled,
  onPaymentSuccess,
}) {
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [chargedTotalInput, setChargedTotalInput] = useState("");
  const [cashReceivedInput, setCashReceivedInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isTicketConfirmOpen, setIsTicketConfirmOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState("total");
  const [splitPayments, setSplitPayments] = useState([createSplitPaymentLine()]);
  const [cartNotice, setCartNotice] = useState("");
  const [openCashSession, setOpenCashSession] = useState(null);
  const previousTableIdRef = useRef(null);
  const cartItemsRef = useRef([]);
  const {
    cartItems,
    activeOrder,
    addItem,
    updateItem,
    removeItem,
    total,
    loadOrderIntoCart,
    clearCart,
  } = useCart();

  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  useEffect(() => {
    const unsubscribeProducts = subscribeToProducts(businessId, setProducts);
    const unsubscribeTables = subscribeToTables(businessId, (nextTables) =>
      setTables(nextTables.filter((table) => !table.deletedAt))
    );
    const unsubscribeCustomers = subscribeToCustomers(businessId, setCustomers);
    const unsubscribeCashSession = subscribeToOpenCashSession(businessId, setOpenCashSession);

    return () => {
      unsubscribeProducts();
      unsubscribeTables();
      unsubscribeCustomers();
      unsubscribeCashSession();
    };
  }, [businessId]);

  useEffect(() => {
    if (!selectedTable?.id) {
      clearCart();
      setSelectedCustomer(null);
      previousTableIdRef.current = null;
      return undefined;
    }

    const unsubscribeOrder = subscribeToActiveOrder(
      businessId,
      selectedTable.id,
      (order) => {
        const previousTableId = previousTableIdRef.current;
        const isFirstTableAssignment = !previousTableId;
        const isSwitchingTables = Boolean(previousTableId && previousTableId !== selectedTable.id);

        if (order) {
          loadOrderIntoCart(order);
        } else if (isFirstTableAssignment && cartItemsRef.current.length > 0) {
          loadOrderIntoCart(null, { preserveItemsOnEmpty: true });
        } else if (isSwitchingTables) {
          clearCart();
        } else {
          loadOrderIntoCart(null);
        }

        previousTableIdRef.current = selectedTable.id;
      }
    );

    return () => unsubscribeOrder();
  }, [businessId, clearCart, loadOrderIntoCart, selectedTable?.id]);

  useEffect(() => {
    if (activeOrder?.customer_id) {
      const matchedCustomer = customers.find((customer) => customer.id === activeOrder.customer_id);
      setSelectedCustomer(
        matchedCustomer || {
          id: activeOrder.customer_id,
          name: activeOrder.customer_name || "Cliente asociado",
        }
      );
    } else if (!activeOrder?.id) {
      setSelectedCustomer(null);
    }
  }, [activeOrder?.customer_id, activeOrder?.customer_name, activeOrder?.id, customers]);

  useEffect(() => {
    if (!selectedTable?.id) {
      setIsCartDrawerOpen(false);
    }
  }, [selectedTable?.id]);

  const categories = useMemo(
    () => ["all", ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );

  const availableTables = useMemo(
    () => [QUICK_SALE_TABLE, ...tables],
    [tables]
  );

  const cashLock = useMemo(
    () => getCashSessionLockInfo(openCashSession),
    [openCashSession]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(search.trim().toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  const ticketConsumption = useMemo(() => {
    const units = cartItems.reduce(
      (sum, item) => sum + (item.useTicket ? Number(item.quantity || 0) : 0),
      0
    );
    const coveredAmount = cartItems.reduce(
      (sum, item) =>
        sum +
        (item.useTicket ? Number(item.price || 0) * Number(item.quantity || 0) : 0),
      0
    );
    return { units, coveredAmount };
  }, [cartItems]);
  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cartItems]
  );
  const payableSubtotal = Math.max(total - ticketConsumption.coveredAmount, 0);
  useEffect(() => {
    setChargedTotalInput(payableSubtotal ? String(Math.round(payableSubtotal)) : "");
  }, [activeOrder?.id, payableSubtotal]);
  useEffect(() => {
    if (paymentMethod !== "cash") {
      setCashReceivedInput("");
      return;
    }

    setCashReceivedInput((current) => {
      const parsed = Number(current);
      if (Number.isFinite(parsed) && parsed > 0) {
        return current;
      }

      return payableSubtotal ? String(Math.round(payableSubtotal)) : "";
    });
  }, [payableSubtotal, paymentMethod]);

  const chargedTotal = useMemo(() => {
    const parsed = Number(chargedTotalInput);
    return Number.isFinite(parsed) ? parsed : payableSubtotal;
  }, [chargedTotalInput, payableSubtotal]);
  const cashChangeState = useMemo(
    () => calculateCashChange(chargedTotal, cashReceivedInput),
    [cashReceivedInput, chargedTotal]
  );
  const cashSuggestions = useMemo(
    () => buildCashTenderSuggestions(chargedTotal),
    [chargedTotal]
  );
  const adjustmentAmount = chargedTotal - payableSubtotal;
  const adjustmentPct = payableSubtotal > 0 ? (adjustmentAmount / payableSubtotal) * 100 : 0;
  const debtAmount =
    selectedCustomer && chargedTotal < payableSubtotal ? payableSubtotal - chargedTotal : 0;
  const selectedCustomerTicketState = useMemo(
    () => getTicketWalletState(selectedCustomer),
    [selectedCustomer]
  );
  const normalizedSplitPayments = useMemo(
    () =>
      splitPayments
        .map((line) => ({
          ...line,
          method: String(line.method || "cash").trim() || "cash",
          amount: Number(line.amount || 0),
        }))
        .filter((line) => line.amount > 0),
    [splitPayments]
  );
  const splitPaymentsTotal = useMemo(
    () => normalizedSplitPayments.reduce((sum, line) => sum + Number(line.amount || 0), 0),
    [normalizedSplitPayments]
  );
  const splitPaymentsDifference = Number((chargedTotal - splitPaymentsTotal).toFixed(2));

  const handleAddProduct = (product) => {
    addItem(product);
    setIsCartDrawerOpen(true);
    if (!selectedTable?.id) {
      setCartNotice("Pedido en borrador. Selecciona una mesa para asociarlo antes de comandar.");
    } else {
      setCartNotice("");
    }
  };

  const handleCommand = async () => {
    if (!selectedTable?.id || cartItems.length === 0) {
      if (!selectedTable?.id) {
        setCartNotice("Selecciona una mesa para poder comandar el pedido.");
      }
      return;
    }

    if (selectedTable.isQuickSale) {
      setCartNotice("La venta rapida no requiere comanda. Usa Pagar para cerrar de inmediato.");
      return;
    }

    setLoading(true);
    try {
      await submitOrder({
        businessId,
        table: selectedTable,
        items: cartItems,
        total,
        orderId: activeOrder?.id,
        customer: selectedCustomer,
      });
      setCartNotice("");
    } finally {
      setLoading(false);
    }
  };

  const openPaymentFlow = () => {
    if (!selectedTable?.id) {
      return;
    }

    if (cashLock.blocked) {
      setCartNotice(cashLock.message);
      return;
    }

    setPaymentMode("total");
    setSplitPayments([createSplitPaymentLine(paymentMethod, chargedTotal ? String(Math.round(chargedTotal)) : "")]);
    if (paymentMethod === "cash") {
      setCashReceivedInput((current) =>
        current || (chargedTotal ? String(Math.round(chargedTotal)) : "")
      );
    }
    setIsPaymentModalOpen(true);
  };

  const executePayment = async ({
    paymentMethodOverride = paymentMethod,
    chargedTotalOverride = chargedTotal,
    splitPaymentsOverride = [],
    cashReceivedOverride = cashChangeState.received,
  } = {}) => {
    if (!selectedTable?.id) {
      return;
    }

    if (cashLock.blocked) {
      setCartNotice(cashLock.message);
      return;
    }

    if (paymentMethodOverride === "cash") {
      const cashState = calculateCashChange(chargedTotalOverride, cashReceivedOverride);
      if (cashState.shortage > 0) {
        setCartNotice("El pago en efectivo no cubre el valor final cobrado.");
        return;
      }
    }

    setLoading(true);
    try {
      let resolvedOrderId = activeOrder?.id;

      if (!resolvedOrderId && cartItems.length > 0) {
        resolvedOrderId = await submitOrder({
          businessId,
          table: selectedTable,
          items: cartItems,
          total,
          customer: selectedCustomer,
        });
      }

      if (!resolvedOrderId) {
        setCartNotice("No hay una orden activa para cobrar.");
        return;
      }

      await requestPayment({
        businessId,
        tableId: selectedTable.id,
        orderId: resolvedOrderId,
        paymentMethod: paymentMethodOverride,
        chargedTotal: chargedTotalOverride,
        cashReceived: paymentMethodOverride === "cash" ? cashReceivedOverride : 0,
        subtotal: payableSubtotal,
        ticketConsumption,
        splitPayments: splitPaymentsOverride,
        customer: selectedCustomer,
      });
      onPaymentSuccess?.(paymentMethodOverride);
      clearCart();
      setSelectedCustomer(null);
      setCashReceivedInput("");
      setIsCartDrawerOpen(false);
      setIsPaymentModalOpen(false);
      setCartNotice("");
      onOrderPaid?.();
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    await executePayment();
  };

  const handleSplitPayment = async () => {
    if (Math.abs(splitPaymentsDifference) > 1) {
      setCartNotice("La suma de los pagos divididos debe coincidir con el valor final cobrado.");
      return;
    }

    await executePayment({
      paymentMethodOverride: "split",
      splitPaymentsOverride: normalizedSplitPayments,
    });
  };

  const handleChargeToAccount = async () => {
    if (!selectedCustomer?.id) {
      setCartNotice("Selecciona un cliente para cargar esta orden a cuenta.");
      return;
    }

    await executePayment({
      paymentMethodOverride: "account_credit",
      chargedTotalOverride: 0,
      splitPaymentsOverride: [],
    });
  };

  const finalizeTicketPayment = async () => {
    if (!selectedTable?.id || !selectedCustomer?.id) {
      setCartNotice("Selecciona un cliente con saldo de tiquetera para consumir un almuerzo.");
      return;
    }

    if (!selectedCustomerTicketState.isActive) {
      setCartNotice("El cliente no tiene saldo activo de tiquetera o su vigencia ya vencio.");
      return;
    }

    setLoading(true);
    try {
      let resolvedOrderId = activeOrder?.id;

      if (!resolvedOrderId && cartItems.length > 0) {
        resolvedOrderId = await submitOrder({
          businessId,
          table: selectedTable,
          items: cartItems,
          total,
          customer: selectedCustomer,
        });
      }

      if (!resolvedOrderId) {
        setCartNotice("No hay una orden activa para consumir con tiquetera.");
        return;
      }

      await requestPayment({
        businessId,
        tableId: selectedTable.id,
        orderId: resolvedOrderId,
        paymentMethod: "ticket_wallet",
        chargedTotal: 0,
        subtotal: payableSubtotal,
        ticketConsumption,
        customer: selectedCustomer,
      });
      onPaymentSuccess?.("ticket_wallet");
      clearCart();
      setSelectedCustomer(null);
      setIsCartDrawerOpen(false);
      setCartNotice("");
      setIsTicketConfirmOpen(false);
      onOrderPaid?.();
    } finally {
      setLoading(false);
    }
  };

  const handleAddSplitPaymentLine = () => {
    setSplitPayments((current) => [...current, createSplitPaymentLine(paymentMethod, "")]);
  };

  const handleUpdateSplitPaymentLine = (lineId, patch) => {
    setSplitPayments((current) =>
      current.map((line) => (line.id === lineId ? { ...line, ...patch } : line))
    );
  };

  const handleRemoveSplitPaymentLine = (lineId) => {
    setSplitPayments((current) =>
      current.length > 1 ? current.filter((line) => line.id !== lineId) : current
    );
  };

  const handleTicketPay = async () => {
    if (!selectedCustomer?.id) {
      setCartNotice("Selecciona un cliente para poder cobrar con tiquetera.");
      return;
    }

    if (!selectedCustomerTicketState.isActive) {
      setCartNotice("El cliente no tiene una tiquetera activa.");
      return;
    }

    if (selectedCustomerTicketState.requiresReuseConfirmation) {
      setIsTicketConfirmOpen(true);
      return;
    }

    await finalizeTicketPayment();
  };

  const handleCancelOrder = async () => {
    if (!selectedTable?.id || !activeOrder?.id) {
      return;
    }

    setLoading(true);
    try {
      await cancelOrder({
        tableId: selectedTable.id,
        orderId: activeOrder.id,
      });
      clearCart();
      setSelectedCustomer(null);
      setIsCartDrawerOpen(false);
      setIsCancelConfirmOpen(false);
      setCartNotice("");
      onOrderCancelled?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="grid gap-5 xl:gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(430px,0.9fr)]">
        <div className="rounded-[28px] bg-white/85 p-5 shadow-lg ring-1 ring-white/70 backdrop-blur xl:p-6">
          <div className="mb-5">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-slate-900">Punto de venta</h2>
              <p className="mt-1 max-w-2xl break-words text-sm leading-6 text-slate-500">
                {selectedTable
                  ? selectedTable.isQuickSale
                    ? "Modo venta rapida activo."
                    : `Mesa activa: ${selectedTable.name || `Mesa ${selectedTable.number}`}`
                  : "Selecciona una mesa para empezar o asignala desde aqui."}
              </p>
            </div>
          </div>

          <div className="mb-5 grid gap-4 xl:grid-cols-[minmax(250px,320px)_minmax(0,1fr)] xl:items-start">
            <SearchSelector
              label="Seleccionar mesa"
              placeholder="Elegir mesa"
              items={availableTables}
              selectedItem={selectedTable}
              onSelectItem={onSelectTable}
              getLabel={(table) => table.name || `Mesa ${table.number}`}
              getDescription={(table) =>
                table.isQuickSale
                  ? "Venta inmediata sin ocupar mesa"
                  : `${table.capacity || table.seats} puestos`
              }
            />

            <div className="min-w-0">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2.5">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="search"
                    placeholder="Buscar producto..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full min-w-0 bg-transparent text-sm outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white md:min-w-[196px] 2xl:hidden"
                >
                  <ShoppingCart size={16} />
                  <span>Ver carrito</span>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-slate-200">
                    {itemCount} · {formatCOP(chargedTotal)}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-[24px] bg-slate-50/85 p-3 ring-1 ring-slate-200/80">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Navegacion rapida
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Filtra la carta y agrega productos sin perder el contexto del cobro.
                </p>
              </div>
              <div className="hidden items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-medium text-slate-500 ring-1 ring-slate-200 lg:inline-flex 2xl:hidden">
                <ShoppingCart size={14} className="text-slate-400" />
                {itemCount} item(s) en el carrito
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  selectedCategory === category
                    ? "bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {category === "all" ? "Todas" : category}
              </button>
            ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
            {filteredProducts.length ? (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleAddProduct(product)}
                  className="group rounded-[28px] bg-white text-left shadow-lg ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div
                    className={`rounded-t-[28px] bg-gradient-to-br p-5 ${getCategoryStyle(product.category)}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em]">
                        {product.category}
                      </span>
                      <div className="rounded-2xl bg-white/70 p-3">
                        <ShoppingBag size={18} />
                      </div>
                    </div>
                    <h3 className="mt-8 line-clamp-2 text-lg font-semibold">{product.name}</h3>
                  </div>

                  <div className="p-5">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Precio
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {formatCOP(product.price)}
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                        Stock {product.stock}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-full rounded-[28px] border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
                <p className="text-sm font-semibold text-slate-900">
                  No encontramos productos con ese filtro.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Prueba otra categoria o cambia el texto de busqueda para continuar la venta.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="hidden 2xl:block">
          <CartPanel
            selectedTable={selectedTable}
            selectedCustomer={selectedCustomer}
            selectedCustomerTicketState={selectedCustomerTicketState}
            customers={customers}
            setSelectedCustomer={setSelectedCustomer}
            cartItems={cartItems}
            subtotal={total}
            ticketCoveredAmount={ticketConsumption.coveredAmount}
            payableSubtotal={payableSubtotal}
            chargedTotalInput={chargedTotalInput}
            setChargedTotalInput={setChargedTotalInput}
            chargedTotal={chargedTotal}
            cashReceivedInput={cashReceivedInput}
            setCashReceivedInput={setCashReceivedInput}
            cashChange={cashChangeState.changeDue}
            cashShortage={cashChangeState.shortage}
            cashSuggestions={cashSuggestions}
            adjustmentAmount={adjustmentAmount}
            adjustmentPct={adjustmentPct}
            debtAmount={debtAmount}
            cartNotice={cartNotice}
            cashLockInfo={cashLock}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            canUseSplitPayment={payableSubtotal > 0}
            loading={loading}
            activeOrder={activeOrder}
            updateItem={updateItem}
            removeItem={removeItem}
            handleCommand={handleCommand}
            handlePay={openPaymentFlow}
            handleTicketPay={handleTicketPay}
            handleOpenCancel={() => setIsCancelConfirmOpen(true)}
          />
        </div>
      </section>

      {isCartDrawerOpen ? (
        <div className="fixed inset-0 z-50 2xl:hidden">
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setIsCartDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto shadow-2xl">
            <CartPanel
              selectedTable={selectedTable}
              selectedCustomer={selectedCustomer}
              selectedCustomerTicketState={selectedCustomerTicketState}
              customers={customers}
              setSelectedCustomer={setSelectedCustomer}
              cartItems={cartItems}
              subtotal={total}
              ticketCoveredAmount={ticketConsumption.coveredAmount}
              payableSubtotal={payableSubtotal}
              chargedTotalInput={chargedTotalInput}
              setChargedTotalInput={setChargedTotalInput}
              chargedTotal={chargedTotal}
              cashReceivedInput={cashReceivedInput}
              setCashReceivedInput={setCashReceivedInput}
              cashChange={cashChangeState.changeDue}
              cashShortage={cashChangeState.shortage}
              cashSuggestions={cashSuggestions}
              adjustmentAmount={adjustmentAmount}
              adjustmentPct={adjustmentPct}
              debtAmount={debtAmount}
              cartNotice={cartNotice}
              cashLockInfo={cashLock}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              canUseSplitPayment={payableSubtotal > 0}
              loading={loading}
              activeOrder={activeOrder}
              updateItem={updateItem}
              removeItem={removeItem}
              handleCommand={handleCommand}
              handlePay={openPaymentFlow}
              handleTicketPay={handleTicketPay}
              handleOpenCancel={() => setIsCancelConfirmOpen(true)}
              onClose={() => setIsCartDrawerOpen(false)}
              mobile
            />
          </div>
        </div>
      ) : null}

      <ModalWrapper
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        maxWidthClass="max-w-3xl"
        icon={{ main: <ShoppingCart size={20} />, close: <X size={18} /> }}
        title="Cobro de la orden"
        description="Define si este cierre sera total o dividido antes de registrar el ingreso."
      >
        <div className="grid gap-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPaymentMode("total")}
              className={`rounded-3xl px-5 py-4 text-left ring-1 transition ${
                paymentMode === "total"
                  ? "bg-emerald-50 text-emerald-900 ring-emerald-300"
                  : "bg-slate-50 text-slate-600 ring-slate-200"
              }`}
            >
              <p className="text-sm font-semibold">Pago total</p>
              <p className="mt-1 text-sm">Un solo metodo para cerrar la orden completa.</p>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode("split")}
              className={`rounded-3xl px-5 py-4 text-left ring-1 transition ${
                paymentMode === "split"
                  ? "bg-sky-50 text-sky-900 ring-sky-300"
                  : "bg-slate-50 text-slate-600 ring-slate-200"
              }`}
            >
              <p className="text-sm font-semibold">Pago dividido</p>
              <p className="mt-1 text-sm">Combina efectivo, Nequi, tarjeta u otros canales.</p>
            </button>
          </div>

          {paymentMode === "total" ? (
            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Metodo actual</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total a registrar</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{formatCOP(chargedTotal)}</p>
                </div>
              </div>
              {paymentMethod === "cash" ? (
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Pago recibido
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {formatCOP(cashChangeState.received)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Cambio
                    </p>
                    <p className="mt-2 text-lg font-semibold text-emerald-700">
                      {formatCOP(cashChangeState.changeDue)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Falta por recibir
                    </p>
                    <p className="mt-2 text-lg font-semibold text-amber-700">
                      {formatCOP(cashChangeState.shortage)}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Lineas de pago</p>
                    <p className="text-sm text-slate-500">La suma debe coincidir con el valor final cobrado.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSplitPaymentLine}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    <Plus size={16} />
                    Agregar linea
                  </button>
                </div>

                <div className="space-y-3">
                  {splitPayments.map((line, index) => (
                    <div
                      key={line.id}
                      className="grid gap-3 rounded-3xl bg-white p-4 ring-1 ring-slate-200 md:grid-cols-[1.1fr_0.9fr_auto]"
                    >
                      <div className="grid gap-2">
                        <label
                          htmlFor={`split-method-${line.id}`}
                          className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
                        >
                          Metodo {index + 1}
                        </label>
                        <select
                          id={`split-method-${line.id}`}
                          value={line.method}
                          onChange={(event) =>
                            handleUpdateSplitPaymentLine(line.id, { method: event.target.value })
                          }
                          className="rounded-2xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-slate-200"
                        >
                          {PAYMENT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <label
                          htmlFor={`split-amount-${line.id}`}
                          className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
                        >
                          Valor
                        </label>
                        <input
                          id={`split-amount-${line.id}`}
                          type="number"
                          min="0"
                          step="1"
                          value={line.amount}
                          onChange={(event) =>
                            handleUpdateSplitPaymentLine(line.id, { amount: event.target.value })
                          }
                          className="rounded-2xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-slate-200"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveSplitPaymentLine(line.id)}
                          disabled={splitPayments.length === 1}
                          className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 disabled:opacity-50"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total final</p>
                  <p className="mt-2 text-xl font-black text-slate-950">{formatCOP(chargedTotal)}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Distribuido</p>
                  <p className="mt-2 text-xl font-black text-slate-950">{formatCOP(splitPaymentsTotal)}</p>
                </div>
                <div className="rounded-3xl bg-[#fff7df] p-4 ring-1 ring-[#d4a72c]/20">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#946200]">Diferencia</p>
                  <p className="mt-2 text-xl font-black text-slate-950">{formatCOP(splitPaymentsDifference)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={paymentMode === "split" ? handleSplitPayment : handlePay}
              disabled={
                loading ||
                (paymentMode === "split" && Math.abs(splitPaymentsDifference) > 1) ||
                (paymentMode === "total" && paymentMethod === "cash" && cashChangeState.shortage > 0) ||
                chargedTotal < 0
              }
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white"
            >
              {loading
                ? "Procesando..."
                : paymentMode === "split"
                  ? "Registrar pago dividido"
                  : "Confirmar pago"}
            </button>
          </div>

          {selectedCustomer ? (
            <button
              type="button"
              onClick={handleChargeToAccount}
              disabled={loading || payableSubtotal <= 0}
              className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
            >
              Cargar a cuenta de {selectedCustomer.name}
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Selecciona un cliente para habilitar la opcion de cargar a cuenta.
            </div>
          )}
        </div>
      </ModalWrapper>

      <ConfirmModal
        open={isCancelConfirmOpen}
        title="Cancelar orden"
        description="La mesa se liberara y no se registrara ninguna venta. Usa esta opcion solo si el cliente no confirma la comanda."
        confirmLabel="Cancelar orden"
        onConfirm={handleCancelOrder}
        onCancel={() => setIsCancelConfirmOpen(false)}
      />
      <ConfirmModal
        open={isTicketConfirmOpen}
        title="Confirmar segundo consumo"
        description="Este cliente ya consumio una tiquetera hace menos de 30 minutos. Confirma solo si invito a alguien mas o corresponde un segundo uso legitimo."
        confirmLabel="Consumir ticket"
        onConfirm={finalizeTicketPayment}
        onCancel={() => setIsTicketConfirmOpen(false)}
      />
    </>
  );
}
