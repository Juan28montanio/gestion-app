import { useEffect, useMemo, useState } from "react";
import TableView from "./components/TableView";
import POSOrder from "./components/POSOrder";
import AdminDashboard from "./components/AdminDashboard";
import ProductManager from "./components/ProductManager";
import TableManager from "./components/TableManager";
import CustomerMenu from "./components/CustomerMenu";
import ToastViewport from "./components/ToastViewport";
import { CartProvider } from "./context/CartContext";

const BUSINESS_ID = "demo_restaurant_business";
const PAYMENT_METHOD_LABELS = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  nequi: "Nequi",
  daviplata: "Daviplata",
};

export default function App() {
  const [selectedTable, setSelectedTable] = useState(null);
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNavigation = () => setPathname(window.location.pathname);

    window.addEventListener("popstate", handleNavigation);
    return () => window.removeEventListener("popstate", handleNavigation);
  }, []);

  const notify = (message) => {
    const toast = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `toast-${Date.now()}`,
      message,
    };

    setToasts((current) => [...current, toast]);
  };

  const dismissToast = (toastId) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  };

  const menuRoute = useMemo(() => {
    const match = pathname.match(/^\/menu\/([^/]+)\/([^/]+)$/);

    if (!match) {
      return null;
    }

    return {
      businessId: decodeURIComponent(match[1]),
      tableId: decodeURIComponent(match[2]),
    };
  }, [pathname]);

  if (menuRoute) {
    return (
      <>
        <CustomerMenu businessId={menuRoute.businessId} tableId={menuRoute.tableId} />
        <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <>
      <CartProvider>
        <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 md:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            <header className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
                Pacifica Control
              </p>
              <h1 className="mt-2 text-3xl font-bold">POS + Finanzas para Restaurante</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                Operacion en tiempo real con inventario, salon, pagos y menu QR.
              </p>
            </header>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <TableView
                businessId={BUSINESS_ID}
                selectedTableId={selectedTable?.id}
                onSelectTable={setSelectedTable}
              />
              <TableManager businessId={BUSINESS_ID} onNotify={notify} />
            </section>

            <POSOrder
              businessId={BUSINESS_ID}
              selectedTable={selectedTable}
              onOrderPaid={() => setSelectedTable(null)}
              onOrderCancelled={() => {
                notify("Orden cancelada. La mesa fue liberada sin registrar venta.");
                setSelectedTable(null);
              }}
              onPaymentSuccess={(paymentMethod) =>
                notify(
                  `Pago registrado correctamente con ${
                    PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod
                  }.`
                )
              }
            />

            <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
              <ProductManager businessId={BUSINESS_ID} />
              <AdminDashboard businessId={BUSINESS_ID} />
            </section>
          </div>
        </main>
      </CartProvider>

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
