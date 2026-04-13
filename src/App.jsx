import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  LayoutGrid,
  Menu,
  Package2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  ReceiptText,
  Wifi,
  WifiOff,
} from "lucide-react";
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

const NAV_ITEMS = [
  { id: "salon", label: "Salon", icon: PanelsTopLeft },
  { id: "pos", label: "Punto de Venta", icon: ReceiptText },
  { id: "inventory", label: "Productos", icon: Package2 },
  { id: "finance", label: "Finanzas", icon: BarChart3 },
];

export default function App() {
  const [selectedTable, setSelectedTable] = useState(null);
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [toasts, setToasts] = useState([]);
  const [activeSection, setActiveSection] = useState("salon");
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    const handleNavigation = () => setPathname(window.location.pathname);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);

    window.addEventListener("popstate", handleNavigation);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("popstate", handleNavigation);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("resize", handleResize);
    };
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

  const currentDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("es-CO", {
        dateStyle: "full",
      }).format(new Date()),
    []
  );

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
        <main className="min-h-screen bg-slate-100 text-slate-900">
          <div className="mx-auto flex min-h-screen max-w-[1800px]">
            {isMobileSidebarOpen ? (
              <div className="fixed inset-0 z-40 lg:hidden">
                <div
                  className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                  onClick={() => setIsMobileSidebarOpen(false)}
                />
                <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-slate-200 bg-white px-5 py-6 shadow-2xl">
                  <div className="rounded-[28px] bg-slate-950 p-5 text-white shadow-lg">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Pacifica Control
                    </p>
                    <h1 className="mt-3 text-2xl font-semibold">Dashboard operativo</h1>
                    <p className="mt-2 text-sm text-slate-300">
                      Salon, ventas, productos y finanzas en una sola vista.
                    </p>
                  </div>

                  <nav className="mt-6 grid gap-2">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveSection(item.id);
                            setIsMobileSidebarOpen(false);
                          }}
                          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                            isActive
                              ? "bg-slate-950 text-white shadow-lg"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <Icon size={18} />
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>
                </aside>
              </div>
            ) : null}

            <aside
              className={`sticky top-0 hidden h-screen shrink-0 border-r border-slate-200 bg-white py-6 transition-all lg:flex lg:flex-col ${
                isSidebarCollapsed ? "w-24 px-3" : "w-72 px-5"
              }`}
            >
              <div className="rounded-[28px] bg-slate-950 p-5 text-white shadow-lg">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Pacifica Control
                </p>
                {!isSidebarCollapsed ? (
                  <>
                    <h1 className="mt-3 text-2xl font-semibold">Dashboard operativo</h1>
                    <p className="mt-2 text-sm text-slate-300">
                      Salon, ventas, productos y finanzas en una sola vista.
                    </p>
                  </>
                ) : null}
              </div>

              <nav className="mt-6 grid gap-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={`flex items-center rounded-2xl py-3 text-left text-sm font-semibold transition ${
                        isActive
                          ? "bg-slate-950 text-white shadow-lg"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      } ${isSidebarCollapsed ? "justify-center px-2" : "gap-3 px-4"}`}
                    >
                      <Icon size={18} />
                      {!isSidebarCollapsed ? item.label : null}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-auto rounded-[28px] bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"}`}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200">
                    <LayoutGrid size={18} className="text-slate-500" />
                  </div>
                  {!isSidebarCollapsed ? (
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Restaurante demo</p>
                      <p className="text-xs text-slate-500">Multi-tenant listo para operar</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Pacifica Control</p>
                    <p className="text-xs capitalize text-slate-500">{currentDateLabel}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isDesktop) {
                          setIsSidebarCollapsed((current) => !current);
                        } else {
                          setIsMobileSidebarOpen(true);
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-100 p-2.5 text-slate-600 transition hover:bg-slate-200"
                    >
                      {isDesktop ? (
                        isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />
                      ) : (
                        <Menu size={18} />
                      )}
                    </button>

                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                        isOnline
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-rose-50 text-rose-700 ring-rose-200"
                      }`}
                    >
                      {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                      {isOnline ? "Firestore conectado" : "Sin conexion"}
                    </span>
                  </div>
                </div>
              </header>

              <div className="flex-1 px-4 py-6 md:px-6">
                {activeSection === "salon" ? (
                  <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                    <TableView
                      businessId={BUSINESS_ID}
                      selectedTableId={selectedTable?.id}
                      onSelectTable={setSelectedTable}
                    />
                    <TableManager businessId={BUSINESS_ID} onNotify={notify} />
                  </section>
                ) : null}

                {activeSection === "pos" ? (
                  <POSOrder
                    businessId={BUSINESS_ID}
                    selectedTable={selectedTable}
                    onSelectTable={setSelectedTable}
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
                ) : null}

                {activeSection === "inventory" ? (
                  <ProductManager businessId={BUSINESS_ID} />
                ) : null}

                {activeSection === "finance" ? (
                  <AdminDashboard businessId={BUSINESS_ID} />
                ) : null}
              </div>
            </div>
          </div>
        </main>
      </CartProvider>

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
