import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
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
import POSSearchSelector from "../features/pos/POSSearchSelector";
import POSCartPanel from "../features/pos/POSCartPanel";
import {
  createSplitPaymentLine,
  getCategoryStyle,
  PAYMENT_OPTIONS,
} from "../features/pos/posHelpers";

function getProductOperationalCopy(product) {
  return {
    badge: product?.recipe_mode === "direct" ? "Ficha" : "Producto",
    detail: "Producto conectado a fichas tecnicas.",
  };
}

function getCompactProductOperationalCopy() {
  return "Ficha directa";
}

function getPaymentErrorMessage(error) {
  const rawMessage = String(error?.message || error || "").trim();
  return rawMessage || "No pudimos registrar el cobro. Revisa la venta e intenta de nuevo.";
}

export default function POSOrder({
  businessId,
  selectedTable,
  onSelectTable,
  onOrderPaid,
  onOrderCancelled,
  onPaymentSuccess,
  onOpenCatalog,
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
  const [paymentModalNotice, setPaymentModalNotice] = useState("");
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
  const hasProducts = products.length > 0;

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
  const hasOrderReadyForPayment =
    Boolean(selectedTable?.id) && (Boolean(activeOrder?.id) || cartItems.length > 0);
  const canConfirmTotalPayment =
    hasOrderReadyForPayment &&
    !loading &&
    !cashLock.blocked &&
    chargedTotal >= 0 &&
    !(paymentMethod === "cash" && cashChangeState.shortage > 0);
  const canConfirmSplitPayment =
    hasOrderReadyForPayment &&
    !loading &&
    !cashLock.blocked &&
    chargedTotal >= 0 &&
    Math.abs(splitPaymentsDifference) <= 1;
  const canChargeToAccount = Boolean(selectedCustomer?.id) && !loading && payableSubtotal > 0;

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

    setPaymentModalNotice("");
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
      setPaymentModalNotice(cashLock.message);
      return;
    }

    if (paymentMethodOverride === "cash") {
      const cashState = calculateCashChange(chargedTotalOverride, cashReceivedOverride);
      if (cashState.shortage > 0) {
        const nextMessage = "El pago en efectivo no cubre el valor final cobrado.";
        setCartNotice(nextMessage);
        setPaymentModalNotice(nextMessage);
        return;
      }
    }

    setLoading(true);
    try {
      setPaymentModalNotice("");
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
      setPaymentModalNotice("");
      onOrderPaid?.();
    } catch (error) {
      const nextMessage = getPaymentErrorMessage(error);
      setCartNotice(nextMessage);
      setPaymentModalNotice(nextMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    await executePayment();
  };

  const handleSplitPayment = async () => {
    if (Math.abs(splitPaymentsDifference) > 1) {
      const nextMessage = "La suma de los pagos divididos debe coincidir con el valor final cobrado.";
      setCartNotice(nextMessage);
      setPaymentModalNotice(nextMessage);
      return;
    }

    await executePayment({
      paymentMethodOverride: "split",
      splitPaymentsOverride: normalizedSplitPayments,
    });
  };

  const handleChargeToAccount = async () => {
    if (!selectedCustomer?.id) {
      const nextMessage = "Selecciona un cliente para cargar esta orden a cuenta.";
      setCartNotice(nextMessage);
      setPaymentModalNotice(nextMessage);
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
      const nextMessage = "Selecciona un cliente con saldo de tiquetera para consumir un almuerzo.";
      setCartNotice(nextMessage);
      setPaymentModalNotice(nextMessage);
      return;
    }

    if (!selectedCustomerTicketState.isActive) {
      const nextMessage = "El cliente no tiene saldo activo de tiquetera o su vigencia ya vencio.";
      setCartNotice(nextMessage);
      setPaymentModalNotice(nextMessage);
      return;
    }

    setLoading(true);
    try {
      setPaymentModalNotice("");
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
      setPaymentModalNotice("");
      setIsTicketConfirmOpen(false);
      onOrderPaid?.();
    } catch (error) {
      const nextMessage = getPaymentErrorMessage(error);
      setCartNotice(nextMessage);
      setPaymentModalNotice(nextMessage);
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
            <POSSearchSelector
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
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                            String(product.recipe_mode || "direct") === "composed"
                              ? "bg-[#fff7df] text-[#946200]"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {getProductOperationalCopy(product).badge}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500 sm:hidden">
                            {getCompactProductOperationalCopy(product)}
                          </span>
                        </div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Precio
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {formatCOP(product.price)}
                        </p>
                        <p className="mt-2 hidden line-clamp-2 text-xs leading-5 text-slate-500 sm:block">
                          {getProductOperationalCopy(product).detail}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                        Stock {product.stock}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            ) : hasProducts ? (
              <div className="col-span-full rounded-[28px] border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
                <p className="text-sm font-semibold text-slate-900">
                  No encontramos productos con ese filtro.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Prueba otra categoria o cambia el texto de busqueda para continuar la venta.
                </p>
              </div>
            ) : (
              <div className="col-span-full rounded-[28px] border border-dashed border-slate-200 bg-white px-5 py-8 shadow-sm">
                <div className="mx-auto grid max-w-3xl gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                  <div className="text-left">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Catalogo pendiente
                    </p>
                    <p className="mt-3 text-xl font-semibold text-slate-900">
                      Antes de vender, crea tu primer producto.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      El punto de venta mostrara la carta en cuanto registres al menos un producto
                      en el catalogo comercial.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => onOpenCatalog?.()}
                        className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-105"
                      >
                        Ir a Productos
                      </button>
                      <span className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Luego regresa aqui para tomar pedidos y cobrar.
                      </span>
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-slate-50 px-5 py-5 text-left ring-1 ring-slate-200">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Flujo sugerido
                    </p>
                    <div className="mt-3 space-y-3 text-sm text-slate-600">
                      <p>1. Crea el producto con precio y categoria.</p>
                      <p>2. Vuelve al POS y selecciona mesa o venta rapida.</p>
                      <p>3. Agrega productos y cobra desde el carrito.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden 2xl:block">
          <POSCartPanel
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
            <POSCartPanel
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
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentModalNotice("");
        }}
        maxWidthClass="max-w-3xl"
        icon={{ main: <ShoppingCart size={20} />, close: <X size={18} /> }}
        title="Cobro de la orden"
        description="Define si este cierre sera total o dividido antes de registrar el ingreso."
      >
        <div className="grid gap-6">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Resumen del cierre
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">Mesa</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedTable?.isQuickSale
                      ? "Venta rapida"
                      : selectedTable?.name || `Mesa ${selectedTable?.number || ""}`.trim() || "Sin asignar"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Items</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{itemCount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Cliente</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedCustomer?.name || "Cliente ocasional"}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Total a registrar
              </p>
              <p className="mt-3 text-3xl font-black text-slate-950">{formatCOP(chargedTotal)}</p>
              <p className="mt-2 text-sm text-emerald-900">
                {paymentMode === "split"
                  ? "Confirma que la suma por metodos coincida con el total."
                  : "Valida el metodo y registra el cierre de esta orden."}
              </p>
            </div>
          </div>

          {paymentModalNotice ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
              {paymentModalNotice}
            </div>
          ) : null}

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

          <div className="sticky bottom-0 z-10 grid gap-3 rounded-[28px] border border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setIsPaymentModalOpen(false);
                setPaymentModalNotice("");
              }}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={paymentMode === "split" ? handleSplitPayment : handlePay}
              disabled={paymentMode === "split" ? !canConfirmSplitPayment : !canConfirmTotalPayment}
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
              disabled={!canChargeToAccount}
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


