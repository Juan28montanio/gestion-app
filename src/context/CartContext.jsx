import { createContext, useContext, useMemo, useState } from "react";

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
  name: product.name,
  category: product.category,
  price: Number(product.price) || 0,
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

  const addItem = (product, modifiers = [], note = "") => {
    setCartItems((current) => [...current, buildCartItem(product, modifiers, note)]);
  };

  const updateItem = (lineId, updates) => {
    setCartItems((current) =>
      current.map((item) =>
        item.lineId === lineId ? { ...item, ...updates } : item
      )
    );
  };

  const removeItem = (lineId) => {
    setCartItems((current) => current.filter((item) => item.lineId !== lineId));
  };

  const clearCart = () => {
    setCartItems([]);
    setActiveOrder(null);
  };

  const loadOrderIntoCart = (order) => {
    setActiveOrder(order);
    setCartItems(order?.items || []);
  };

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
    [selectedTable, cartItems, activeOrder, total]
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
