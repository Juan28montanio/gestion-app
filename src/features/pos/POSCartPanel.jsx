import { useId } from "react";
import { UserRound, X } from "lucide-react";
import { getTicketWalletState } from "../../services/customerService";
import { formatCOP } from "../../utils/formatters";
import { PAYMENT_METHOD_LABELS } from "../../utils/payments";
import POSSearchSelector from "./POSSearchSelector";
import { getPaymentReadiness, getPosOperationStatus, PAYMENT_OPTIONS } from "./posHelpers";

export default function POSCartPanel({
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
        <POSSearchSelector
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
                  <p className="mt-1 text-lg font-semibold text-emerald-200">{formatCOP(cashChange)}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Falta por recibir</p>
                  <p className="mt-1 text-lg font-semibold text-amber-200">{formatCOP(cashShortage)}</p>
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

        <div className="sticky bottom-0 z-10 -mx-2 mt-5 rounded-[24px] border border-slate-800 bg-[rgba(15,23,42,0.96)] p-3 shadow-[0_-12px_30px_rgba(2,6,23,0.35)] backdrop-blur">
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
    </div>
  );
}
