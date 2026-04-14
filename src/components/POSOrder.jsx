import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Search,
  ShoppingBag,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { subscribeToCustomers } from "../services/customerService";
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
import { formatCOP } from "../utils/formatters";
import { QUICK_SALE_TABLE } from "../utils/posConstants";

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
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-slate-200 transition hover:ring-emerald-300 md:min-w-[280px]"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
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
  customers,
  setSelectedCustomer,
  cartItems,
  subtotal,
  chargedTotalInput,
  setChargedTotalInput,
  adjustmentAmount,
  adjustmentPct,
  debtAmount,
  cartNotice,
  cashLockInfo,
  paymentMethod,
  setPaymentMethod,
  loading,
  activeOrder,
  updateItem,
  removeItem,
  handleCommand,
  handlePay,
  handleOpenCancel,
  onClose,
  mobile = false,
}) {
  const adjustmentLabel =
    adjustmentAmount < 0 ? "Descuento aplicado" : adjustmentAmount > 0 ? "Aumento aplicado" : "Sin ajuste";

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
          getLabel={(customer) => customer.name}
          getDescription={(customer) =>
            `${customer.phone || "Sin telefono"} · Deuda ${formatCOP(customer.debt_balance || 0)}`
          }
          icon={UserRound}
        />
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
                    {formatCOP(item.price)} x {item.quantity}
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

        {cashLockInfo?.blocked ? (
          <div className="mb-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-xs text-rose-200 ring-1 ring-rose-400/20">
            {cashLockInfo.message}
          </div>
        ) : null}

        <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Total real de productos</span>
            <span>{formatCOP(subtotal)}</span>
          </div>
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Valor final cobrado
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={chargedTotalInput}
              onChange={(event) => setChargedTotalInput(event.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
            />
          </div>
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
        </div>

        <div className="mb-5 mt-5">
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
              Pagar
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
  const [loading, setLoading] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
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
    const sourceAmount = Number(activeOrder?.total ?? total ?? 0);
    setChargedTotalInput(sourceAmount ? String(Math.round(sourceAmount)) : "");
  }, [activeOrder?.id, activeOrder?.total, total]);

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

  const chargedTotal = useMemo(() => {
    const parsed = Number(chargedTotalInput);
    return Number.isFinite(parsed) ? parsed : total;
  }, [chargedTotalInput, total]);

  const adjustmentAmount = chargedTotal - total;
  const adjustmentPct = total > 0 ? (adjustmentAmount / total) * 100 : 0;
  const debtAmount = selectedCustomer && chargedTotal < total ? total - chargedTotal : 0;

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

  const handlePay = async () => {
    if (!selectedTable?.id) {
      return;
    }

    if (cashLock.blocked) {
      setCartNotice(cashLock.message);
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
        setCartNotice("No hay una orden activa para cobrar.");
        return;
      }

      await requestPayment({
        businessId,
        tableId: selectedTable.id,
        orderId: resolvedOrderId,
        paymentMethod,
        chargedTotal,
        subtotal: total,
        customer: selectedCustomer,
      });
      onPaymentSuccess?.(paymentMethod);
      clearCart();
      setSelectedCustomer(null);
      setIsCartDrawerOpen(false);
      setCartNotice("");
      onOrderPaid?.();
    } finally {
      setLoading(false);
    }
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
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
          <div className="mb-5 grid gap-4 xl:grid-cols-[auto_1fr] xl:items-end">
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

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Punto de venta</h2>
                <p className="text-sm text-slate-500">
                  {selectedTable
                    ? selectedTable.isQuickSale
                      ? "Modo venta rapida activo."
                      : `Mesa activa: ${selectedTable.name || `Mesa ${selectedTable.number}`}`
                    : "Selecciona una mesa para empezar o asignala desde aqui."}
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2.5">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="search"
                    placeholder="Buscar producto..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full bg-transparent text-sm outline-none md:w-56"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white xl:hidden"
                >
                  <ShoppingCart size={16} />
                  Ver carrito
                </button>
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
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

          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {filteredProducts.map((product) => (
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
                  <h3 className="mt-8 text-lg font-semibold">{product.name}</h3>
                </div>

                <div className="p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Precio</p>
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
            ))}
          </div>
        </div>

        <div className="hidden xl:block">
          <CartPanel
            selectedTable={selectedTable}
            selectedCustomer={selectedCustomer}
            customers={customers}
            setSelectedCustomer={setSelectedCustomer}
            cartItems={cartItems}
            subtotal={total}
            chargedTotalInput={chargedTotalInput}
            setChargedTotalInput={setChargedTotalInput}
            adjustmentAmount={adjustmentAmount}
            adjustmentPct={adjustmentPct}
            debtAmount={debtAmount}
            cartNotice={cartNotice}
            cashLockInfo={cashLock}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            loading={loading}
            activeOrder={activeOrder}
            updateItem={updateItem}
            removeItem={removeItem}
            handleCommand={handleCommand}
            handlePay={handlePay}
            handleOpenCancel={() => setIsCancelConfirmOpen(true)}
          />
        </div>
      </section>

      {isCartDrawerOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setIsCartDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto shadow-2xl">
            <CartPanel
              selectedTable={selectedTable}
              selectedCustomer={selectedCustomer}
              customers={customers}
              setSelectedCustomer={setSelectedCustomer}
              cartItems={cartItems}
              subtotal={total}
              chargedTotalInput={chargedTotalInput}
              setChargedTotalInput={setChargedTotalInput}
              adjustmentAmount={adjustmentAmount}
              adjustmentPct={adjustmentPct}
              debtAmount={debtAmount}
              cartNotice={cartNotice}
              cashLockInfo={cashLock}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              loading={loading}
              activeOrder={activeOrder}
              updateItem={updateItem}
              removeItem={removeItem}
              handleCommand={handleCommand}
              handlePay={handlePay}
              handleOpenCancel={() => setIsCancelConfirmOpen(true)}
              onClose={() => setIsCartDrawerOpen(false)}
              mobile
            />
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={isCancelConfirmOpen}
        title="Cancelar orden"
        description="La mesa se liberara y no se registrara ninguna venta. Usa esta opcion solo si el cliente no confirma la comanda."
        confirmLabel="Cancelar orden"
        onConfirm={handleCancelOrder}
        onCancel={() => setIsCancelConfirmOpen(false)}
      />
    </>
  );
}
