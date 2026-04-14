import { createContext, useCallback, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

const createLineId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `line-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const buildCartItem = (product, modifiers = [], note = "") => ({
  lineId: createLineId(),
  productId: product.id,
  id: product.id,
  name: product.name,
  category: product.category,
  price: Number(product.price) || 0,
  product_type: product.product_type || "standard",
  ticket_units: Number(product.ticket_units || 0),
  ticket_validity_days: Number(product.ticket_validity_days || 30),
  ticket_eligible:
    product.ticket_eligible === true ||
    /almuerzo|ejecutivo|menu/i.test(String(product.category || product.name || "")),
  useTicket: false,
  quantity: 1,
  modifiers,
  note,
});

const getItemTotal = (item) => {
  const modifiersTotal = (item.modifiers || []).reduce(
    (sum, modifier) => sum + (Number(modifier.price) || 0),
    0
  );

  return (item.price + modifiersTotal) * item.quantity;
};

export function CartProvider({ children }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);

  const addItem = useCallback((product, modifiers = [], note = "") => {
    setCartItems((current) => [...current, buildCartItem(product, modifiers, note)]);
  }, []);

  const updateItem = useCallback((lineId, updates) => {
    setCartItems((current) =>
      current.map((item) =>
        item.lineId === lineId ? { ...item, ...updates } : item
      )
    );
  }, []);

  const removeItem = useCallback((lineId) => {
    setCartItems((current) => current.filter((item) => item.lineId !== lineId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setActiveOrder(null);
  }, []);

  const loadOrderIntoCart = useCallback((order, options = {}) => {
    const shouldPreserveItemsOnEmpty = Boolean(options.preserveItemsOnEmpty);
    setActiveOrder(order);
    if (!order && shouldPreserveItemsOnEmpty) {
      return;
    }

    setCartItems(
      (order?.items || []).map((item) => ({
        lineId: item.lineId || createLineId(),
        productId: item.productId || item.id,
        ...item,
      }))
    );
  }, []);

  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + getItemTotal(item), 0),
    [cartItems]
  );

  const value = useMemo(
    () => ({
      selectedTable,
      setSelectedTable,
      cartItems,
      activeOrder,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      loadOrderIntoCart,
      total,
    }),
    [
      selectedTable,
      cartItems,
      activeOrder,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      loadOrderIntoCart,
      total,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
