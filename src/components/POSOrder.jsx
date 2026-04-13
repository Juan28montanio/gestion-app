import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, ShoppingCart, X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { subscribeToProducts } from "../services/productService";
import {
  cancelOrder,
  requestPayment,
  submitOrder,
  subscribeToActiveOrder,
} from "../services/orderService";
import ConfirmModal from "./ConfirmModal";
import { formatCOP } from "../utils/formatters";

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

function CartPanel({
  selectedTable,
  cartItems,
  total,
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
  return (
    <div
      className={`rounded-[28px] bg-slate-950 p-6 text-white shadow-lg ${
        mobile ? "h-full rounded-none" : ""
      }`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Carrito de pedido</h2>
          <p className="text-sm text-slate-300">
            {selectedTable
              ? `Tomando orden para ${selectedTable.name || `Mesa ${selectedTable.number}`}.`
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
        <div className="mb-4 flex items-center justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatCOP(total)}</span>
        </div>

        <div className="mb-5">
          <p className="mb-3 text-sm text-slate-300">Metodo de pago</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {PAYMENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPaymentMethod(option.value)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                  paymentMethod === option.value
                    ? "border-sky-500 bg-sky-500 text-white"
                    : "border-slate-600 bg-transparent text-slate-200 hover:border-slate-400"
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
            disabled={loading || !selectedTable || cartItems.length === 0}
            className="rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Comandar
          </button>

          <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
            <button
              type="button"
              onClick={handlePay}
              disabled={loading || !selectedTable || !activeOrder?.id}
              className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/25 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
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
  onOrderPaid,
  onOrderCancelled,
  onPaymentSuccess,
}) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
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
    const unsubscribeProducts = subscribeToProducts(businessId, setProducts);
    return () => unsubscribeProducts();
  }, [businessId]);

  useEffect(() => {
    if (!selectedTable?.id) {
      clearCart();
      return undefined;
    }

    const unsubscribeOrder = subscribeToActiveOrder(
      businessId,
      selectedTable.id,
      loadOrderIntoCart
    );

    return () => unsubscribeOrder();
  }, [businessId, selectedTable?.id]);

  useEffect(() => {
    if (!selectedTable?.id) {
      setIsCartDrawerOpen(false);
    }
  }, [selectedTable?.id]);

  const categories = useMemo(
    () => ["all", ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  const handleAddProduct = (product) => {
    addItem(product);
    setIsCartDrawerOpen(true);
  };

  const handleCommand = async () => {
    if (!selectedTable?.id || cartItems.length === 0) {
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
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!selectedTable?.id || !activeOrder?.id) {
      return;
    }

    setLoading(true);

    try {
      await requestPayment({
        businessId,
        tableId: selectedTable.id,
        orderId: activeOrder.id,
        paymentMethod,
      });
      onPaymentSuccess?.(paymentMethod);
      clearCart();
      setIsCartDrawerOpen(false);
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
      setIsCartDrawerOpen(false);
      setIsCancelConfirmOpen(false);
      onOrderCancelled?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] bg-white p-6 shadow-lg ring-1 ring-slate-200">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Punto de venta</h2>
              <p className="text-sm text-slate-500">
                {selectedTable
                  ? `Mesa activa: ${selectedTable.name || `Mesa ${selectedTable.number}`}`
                  : "Selecciona una mesa para empezar"}
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="search"
                placeholder="Buscar producto..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 md:w-64"
              />

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

          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  selectedCategory === category
                    ? "bg-slate-900 text-white"
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
                  className={`rounded-t-[28px] bg-gradient-to-br p-5 ${getCategoryStyle(
                    product.category
                  )}`}
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
            ))}
          </div>
        </div>

        <div className="hidden xl:block">
          <CartPanel
            selectedTable={selectedTable}
            cartItems={cartItems}
            total={total}
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
              cartItems={cartItems}
              total={total}
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
