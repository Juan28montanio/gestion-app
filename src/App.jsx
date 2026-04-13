import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
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
import { SmartProfitIsotype, SmartProfitWordmark } from "./components/SmartProfitMark";

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

const SECTION_TITLES = {
  salon: "Salon",
  pos: "Punto de Venta",
  inventory: "Productos",
  finance: "Finanzas",
};

function AppFooter() {
  return (
    <footer className="mt-8 rounded-[28px] border border-white/60 bg-white/75 px-6 py-4 shadow-lg backdrop-blur">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <SmartProfitIsotype className="h-9 w-9" />
          <div>
            <p className="text-sm font-bold text-slate-900">SmartProfit</p>
            <p className="text-xs text-slate-500">El control que tu rentabilidad merece</p>
          </div>
        </div>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
          SaaS POS y control operativo
        </p>
      </div>
    </footer>
  );
}

function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(160deg,#0f172a_0%,#111827_48%,#1f2937_100%)] px-6">
      <div className="w-full max-w-xl rounded-[36px] border border-white/10 bg-white/6 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex w-full justify-center">
          <img
            src="/smartprofit_logo.png"
            alt="SmartProfit"
            className="h-28 w-auto object-contain drop-shadow-[0_18px_50px_rgba(5,150,105,0.25)]"
          />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200">
          SmartProfit
        </p>
        <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">
          El control que tu rentabilidad merece
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Inteligencia operativa para restaurante, punto de venta y control financiero.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [selectedTable, setSelectedTable] = useState(null);
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [toasts, setToasts] = useState([]);
  const [activeSection, setActiveSection] = useState("salon");
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const handleNavigation = () => setPathname(window.location.pathname);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);

    window.addEventListener("popstate", handleNavigation);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("resize", handleResize);

    const splashTimeout = window.setTimeout(() => setIsBooting(false), 1200);

    return () => {
      window.removeEventListener("popstate", handleNavigation);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("resize", handleResize);
      window.clearTimeout(splashTimeout);
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

  useEffect(() => {
    const sectionLabel = SECTION_TITLES[activeSection] || "Dashboard";
    document.title = menuRoute
      ? "SmartProfit | Menu digital"
      : `SmartProfit | ${sectionLabel}`;
  }, [activeSection, menuRoute]);

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
        <main className="min-h-screen bg-transparent text-slate-900">
          {isBooting ? <SplashScreen /> : null}

          <div className="mx-auto flex min-h-screen max-w-[1800px]">
            {isMobileSidebarOpen ? (
              <div className="fixed inset-0 z-40 lg:hidden">
                <div
                  className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                  onClick={() => setIsMobileSidebarOpen(false)}
                />
                <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-emerald-900/15 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] px-5 py-6 text-white shadow-2xl">
                  <SmartProfitWordmark />
                  <p className="mt-5 text-sm text-slate-300">
                    El control que tu rentabilidad merece.
                  </p>

                  <nav className="mt-8 grid gap-2">
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
                              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-950/30"
                              : "bg-white/6 text-slate-300 hover:bg-white/10"
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
              className={`sticky top-0 z-40 hidden h-screen shrink-0 border-r border-emerald-950/10 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] py-6 text-white transition-all lg:flex lg:flex-col ${
                isSidebarCollapsed ? "w-24 px-3" : "w-72 px-5"
              }`}
            >
              <div className="rounded-[30px] border border-white/8 bg-white/6 p-5 shadow-xl backdrop-blur">
                <SmartProfitWordmark collapsed={isSidebarCollapsed} />
                {!isSidebarCollapsed ? (
                  <>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                      SmartProfit
                    </p>
                    <h1 className="mt-3 text-2xl font-black text-white">Dashboard operativo</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      El control que tu rentabilidad merece.
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
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-950/30"
                          : "bg-white/6 text-slate-300 hover:bg-white/10"
                      } ${isSidebarCollapsed ? "justify-center px-2" : "gap-3 px-4"}`}
                    >
                      <Icon size={18} />
                      {!isSidebarCollapsed ? item.label : null}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-auto rounded-[28px] border border-[#d4a72c]/20 bg-[linear-gradient(135deg,rgba(212,167,44,0.16),rgba(15,23,42,0.15))] p-5 ring-1 ring-white/5">
                <div
                  className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"}`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                    <SmartProfitIsotype className="h-7 w-7" />
                  </div>
                  {!isSidebarCollapsed ? (
                    <div>
                      <p className="text-sm font-bold text-white">SmartProfit SaaS</p>
                      <p className="text-xs text-slate-300">Gestion y rentabilidad en tiempo real</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 px-4 py-3 backdrop-blur-xl md:px-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isDesktop) {
                          setIsSidebarCollapsed((current) => !current);
                        } else {
                          setIsMobileSidebarOpen(true);
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50"
                    >
                      {isDesktop ? (
                        isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />
                      ) : (
                        <Menu size={18} />
                      )}
                    </button>

                    <div>
                      <p className="text-sm font-bold text-slate-900">SmartProfit</p>
                      <p className="text-xs capitalize text-slate-500">{currentDateLabel}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#d4a72c]/30 bg-[#fff7df] px-3 py-1.5 text-xs font-semibold text-[#946200]">
                      Rentabilidad inteligente
                    </span>
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

              <div className="flex-1 px-4 py-6 pb-28 md:px-6 md:pb-32">
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

                <AppFooter />
              </div>
            </div>
          </div>
        </main>
      </CartProvider>

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
