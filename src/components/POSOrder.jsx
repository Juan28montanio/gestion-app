import { useEffect, useMemo, useState } from "react";
import { useCart } from "../context/CartContext";
import { subscribeToProducts } from "../services/productService";
import { requestPayment, submitOrder, subscribeToActiveOrder } from "../services/orderService";
import { formatCOP } from "../utils/formatters";

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "card", label: "Tarjeta" },
];

export default function POSOrder({ businessId, selectedTable, onOrderPaid }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
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

  const categories = useMemo(
    () => ["all", ...new Set(products.map((product) => product.category))],
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
      clearCart();
      onOrderPaid?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Punto de Venta</h2>
            <p className="text-sm text-slate-500">
              {selectedTable
                ? `Mesa activa: ${selectedTable.number || selectedTable.name}`
                : "Selecciona una mesa para empezar"}
            </p>
          </div>

          <input
            type="search"
            placeholder="Buscar producto..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 md:max-w-xs"
          />
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

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleAddProduct(product)}
              className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-slate-900 hover:shadow-sm"
            >
              <p className="text-sm text-slate-500">{product.category}</p>
              <h3 className="font-semibold text-slate-900">{product.name}</h3>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {formatCOP(product.price)}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-lg">
        <div className="mb-5">
          <h2 className="text-xl font-semibold">Carrito de Pedido</h2>
          <p className="text-sm text-slate-300">
            Agrega notas, modificadores y procesa el cobro desde aquí.
          </p>
        </div>

        <div className="space-y-3">
          {cartItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
              No hay productos agregados todavía.
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
                  onChange={(event) =>
                    updateItem(item.lineId, { note: event.target.value })
                  }
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

          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="mb-4 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm"
          >
            {PAYMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={handleCommand}
              disabled={loading || !selectedTable || cartItems.length === 0}
              className="rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Comandar
            </button>
            <button
              type="button"
              onClick={handlePay}
              disabled={loading || !selectedTable || !activeOrder?.id}
              className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Pagar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
