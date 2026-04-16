import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Boxes,
  ChevronRight,
  ContactRound,
  Home,
  Menu,
  Package2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  Settings2,
  Wifi,
  WifiOff,
  Wallet,
} from "lucide-react";
import POSOrder from "./components/POSOrder";
import AdminDashboard from "./components/AdminDashboard";
import CustomerManager from "./components/CustomerManager";
import ProductManager from "./components/ProductManager";
import TableManager from "./components/TableManager";
import TicketWalletManager from "./components/TicketWalletManager";
import CustomerMenu from "./components/CustomerMenu";
import ToastViewport from "./components/ToastViewport";
import {
  getCashSessionLockInfo,
  subscribeToOpenCashSession,
} from "./services/cashClosingService";
import { CartProvider } from "./context/CartContext";
import { SmartProfitIsotype, SmartProfitWordmark } from "./components/SmartProfitMark";

const BUSINESS_ID = "demo_restaurant_business";
const SHELL_STORAGE_KEY = "smartprofit-shell-v4";
const PAYMENT_METHOD_LABELS = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  nequi: "Nequi",
  daviplata: "Daviplata",
  ticket_wallet: "Tiquetera",
};

const DOMAIN_GROUPS = [
  {
    id: "start",
    label: "Inicio",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: Home,
        description: "Centro de control, alertas y accesos rapidos.",
        views: [{ id: "overview", label: "Centro de control" }],
      },
    ],
  },
  {
    id: "operation",
    label: "Operacion",
    items: [
      {
        id: "operation",
        label: "Operacion",
        icon: PanelsTopLeft,
        description: "Salon, mostrador y continuidad de ordenes.",
        views: [
          { id: "salon", label: "Salon" },
          { id: "counter", label: "Mostrador" },
        ],
      },
      {
        id: "catalog",
        label: "Productos",
        icon: Package2,
        description: "Catalogo comercial de venta rapida.",
        views: [{ id: "products", label: "Catalogo" }],
      },
    ],
  },
  {
    id: "administration",
    label: "Administracion",
    items: [
      {
        id: "cash",
        label: "Caja y Finanzas",
        icon: Wallet,
        description: "Caja activa, reportes y flujo de dinero.",
        views: [{ id: "overview", label: "Caja activa" }],
      },
      {
        id: "resources",
        label: "Centro de Recursos",
        icon: Boxes,
        description: "Proveedores, insumos, compras y fichas tecnicas.",
        views: [
          { id: "suppliers", label: "Proveedores" },
          { id: "ingredients", label: "Insumos" },
          { id: "purchases", label: "Compras" },
          { id: "recipes", label: "Fichas tecnicas" },
        ],
      },
      {
        id: "clients",
        label: "Clientes y Cartera",
        icon: ContactRound,
        description: "Clientes, relacion comercial y tiqueteras.",
        views: [
          { id: "customers", label: "Clientes" },
          { id: "ticketing", label: "Ticketeras" },
        ],
      },
      {
        id: "analytics",
        label: "Analitica",
        icon: BarChart3,
        description: "Tendencias y rentabilidad en modulo independiente.",
        views: [{ id: "overview", label: "Proxima fase" }],
      },
      {
        id: "settings",
        label: "Configuracion",
        icon: Settings2,
        description: "Seguridad, parametros y estructura operativa.",
        views: [{ id: "overview", label: "Proxima fase" }],
      },
    ],
  },
];

const DEFAULT_DOMAIN_VIEWS = DOMAIN_GROUPS.flatMap((group) => group.items).reduce(
  (accumulator, domain) => {
    accumulator[domain.id] = domain.views[0]?.id || "overview";
    return accumulator;
  },
  {}
);

const DOMAIN_BY_ID = DOMAIN_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ ...item, sectionLabel: group.label }))
).reduce((accumulator, item) => {
  accumulator[item.id] = item;
  return accumulator;
}, {});

function buildShellHash(domainId, viewId) {
  return `#/${domainId}/${viewId}`;
}

function parseShellHash(hash) {
  if (!hash) {
    return null;
  }

  const match = hash.match(/^#\/([^/]+)\/([^/]+)$/);
  if (!match) {
    return null;
  }

  const domainId = decodeURIComponent(match[1]);
  const viewId = decodeURIComponent(match[2]);
  const domain = DOMAIN_BY_ID[domainId];

  if (!domain || !domain.views.some((view) => view.id === viewId)) {
    return null;
  }

  return { domainId, viewId };
}

function getStoredShellState() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SHELL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitialShellState() {
  const stored = getStoredShellState();
  const domainViews = {
    ...DEFAULT_DOMAIN_VIEWS,
    ...(stored?.domainViews || {}),
  };
  const hashRoute = typeof window !== "undefined" ? parseShellHash(window.location.hash) : null;
  const activeDomain = hashRoute?.domainId || stored?.activeDomain || "dashboard";

  if (hashRoute?.viewId) {
    domainViews[hashRoute.domainId] = hashRoute.viewId;
  }

  return {
    activeDomain,
    domainViews,
    isSidebarCollapsed: Boolean(stored?.isSidebarCollapsed),
  };
}

function AppFooter() {
  return (
    <footer className="relative z-0 mt-10 rounded-[28px] border border-white/60 bg-white/75 px-6 py-4 shadow-lg backdrop-blur">
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

function DashboardWorkspace({ activeCashSession, isOnline, onOpenDomain, selectedTable }) {
  const workspaceCards = [
    {
      id: "operation-salon",
      eyebrow: "Operacion",
      title: "Salon y mesas",
      description: "Abre o continua ordenes sin salir del flujo de servicio.",
      action: "Ir al salon",
      onClick: () => onOpenDomain("operation", "salon"),
    },
    {
      id: "operation-counter",
      eyebrow: "Venta rapida",
      title: "Mostrador",
      description: "Atiende pedidos directos y cobros rapidos desde el carrito.",
      action: "Abrir POS",
      onClick: () => onOpenDomain("operation", "counter"),
    },
    {
      id: "cash",
      eyebrow: "Caja",
      title: activeCashSession ? "Caja abierta" : "Caja pendiente",
      description: activeCashSession
        ? "El turno esta activo y listo para seguir registrando movimientos."
        : "Abre caja antes de comenzar a cobrar ventas.",
      action: "Ver caja",
      onClick: () => onOpenDomain("cash", "overview"),
    },
    {
      id: "resources",
      eyebrow: "Recursos",
      title: "Ingenieria del negocio",
      description: "Gestiona compras, insumos y fichas tecnicas desde una sola zona.",
      action: "Abrir recursos",
      onClick: () => onOpenDomain("resources", "suppliers"),
    },
  ];

  return (
    <section className="space-y-6">
      <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
              Dashboard
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Centro de control de SmartProfit
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              La Fase 1 ya separa operacion, caja, recursos y clientes en dominios claros para
              que el resto de la reestructuracion crezca sobre una base escalable.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-emerald-100 bg-emerald-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Operacion</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {selectedTable ? `Mesa activa: ${selectedTable.name || `Mesa ${selectedTable.number}`}` : "Sin mesa activa"}
              </p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Caja</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {activeCashSession ? "Turno abierto" : "Pendiente de apertura"}
              </p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sistema</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {isOnline ? "Firestore en linea" : "Modo desconectado"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {workspaceCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={card.onClick}
            className="group rounded-[28px] bg-white/85 p-5 text-left shadow-lg ring-1 ring-white/70 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {card.eyebrow}
            </p>
            <h3 className="mt-4 text-xl font-bold text-slate-950">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">{card.description}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
              {card.action}
              <ChevronRight size={16} className="transition group-hover:translate-x-1" />
            </span>
          </button>
        ))}
      </section>
    </section>
  );
}

function ComingSoonWorkspace({ title, eyebrow, description, primaryActionLabel, onPrimaryAction }) {
  return (
    <section className="rounded-[28px] bg-white/85 p-8 shadow-lg ring-1 ring-white/70 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black text-slate-950">{title}</h2>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Estado</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">Estructura creada</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Siguiente paso</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">Implementacion funcional</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Objetivo</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">Reducir mezcla de contextos</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onPrimaryAction}
        className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20"
      >
        {primaryActionLabel}
        <ChevronRight size={16} />
      </button>
    </section>
  );
}

function DomainHero({ domain, view, onChangeView }) {
  return (
    <section className="mb-6 rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {domain.sectionLabel}
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">{domain.label}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{domain.description}</p>
        </div>

        {domain.views.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {domain.views.map((domainView) => (
              <button
                key={domainView.id}
                type="button"
                onClick={() => onChangeView(domainView.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  view.id === domainView.id
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-900/15"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {domainView.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {view.label}
          </div>
        )}
      </div>
    </section>
  );
}

export default function App() {
  const [selectedTable, setSelectedTable] = useState(null);
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [toasts, setToasts] = useState([]);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const [isBooting, setIsBooting] = useState(true);
  const [openCashSession, setOpenCashSession] = useState(null);
  const [shellState, setShellState] = useState(() => getInitialShellState());

  const activeDomain = shellState.activeDomain;
  const activeViewId = shellState.domainViews[activeDomain] || DEFAULT_DOMAIN_VIEWS[activeDomain];
  const currentDomain = DOMAIN_BY_ID[activeDomain] || DOMAIN_BY_ID.dashboard;
  const currentView =
    currentDomain.views.find((view) => view.id === activeViewId) || currentDomain.views[0];

  useEffect(() => {
    const handleNavigation = () => setPathname(window.location.pathname);
    const handleHashChange = () => {
      const nextRoute = parseShellHash(window.location.hash);
      if (!nextRoute) {
        return;
      }

      setShellState((current) => ({
        ...current,
        activeDomain: nextRoute.domainId,
        domainViews: {
          ...current.domainViews,
          [nextRoute.domainId]: nextRoute.viewId,
        },
      }));
    };
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);

    window.addEventListener("popstate", handleNavigation);
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("resize", handleResize);

    const splashTimeout = window.setTimeout(() => setIsBooting(false), 1200);

    return () => {
      window.removeEventListener("popstate", handleNavigation);
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("resize", handleResize);
      window.clearTimeout(splashTimeout);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToOpenCashSession(BUSINESS_ID, setOpenCashSession);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (menuRoute) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const nextHash = buildShellHash(activeDomain, currentView.id);
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, "", nextUrl);
    }

    window.localStorage.setItem(
      SHELL_STORAGE_KEY,
      JSON.stringify({
        activeDomain,
        domainViews: shellState.domainViews,
        isSidebarCollapsed: shellState.isSidebarCollapsed,
      })
    );
  }, [
    activeDomain,
    currentView.id,
    menuRoute,
    shellState.domainViews,
    shellState.isSidebarCollapsed,
  ]);

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

  const cashLockInfo = useMemo(
    () => getCashSessionLockInfo(openCashSession),
    [openCashSession]
  );

  useEffect(() => {
    document.title = menuRoute
      ? "SmartProfit | Menu digital"
      : `SmartProfit | ${currentDomain.label || "Dashboard"}`;
  }, [currentDomain.label, menuRoute]);

  const navigateToDomain = (domainId, viewId = null) => {
    const domain = DOMAIN_BY_ID[domainId];
    if (!domain) {
      return;
    }

    const nextViewId =
      viewId ||
      shellState.domainViews[domainId] ||
      domain.views[0]?.id ||
      DEFAULT_DOMAIN_VIEWS[domainId];

    setShellState((current) => ({
      ...current,
      activeDomain: domainId,
      domainViews: {
        ...current.domainViews,
        [domainId]: nextViewId,
      },
    }));
    setIsMobileSidebarOpen(false);
  };

  const setCurrentDomainView = (viewId) => {
    setShellState((current) => ({
      ...current,
      domainViews: {
        ...current.domainViews,
        [current.activeDomain]: viewId,
      },
    }));
  };

  const renderDomainContent = () => {
    if (activeDomain === "dashboard") {
      return (
        <DashboardWorkspace
          activeCashSession={openCashSession}
          isOnline={isOnline}
          onOpenDomain={navigateToDomain}
          selectedTable={selectedTable}
        />
      );
    }

    if (activeDomain === "operation" && currentView.id === "salon") {
      return (
        <TableManager
          businessId={BUSINESS_ID}
          selectedTableId={selectedTable?.id}
          onSelectTable={setSelectedTable}
          onNotify={notify}
        />
      );
    }

    if (activeDomain === "operation" && currentView.id === "counter") {
      return (
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
      );
    }

    if (activeDomain === "catalog") {
      return <ProductManager businessId={BUSINESS_ID} mode="catalog" />;
    }

    if (activeDomain === "cash") {
      return <AdminDashboard businessId={BUSINESS_ID} />;
    }

    if (activeDomain === "resources") {
      return (
        <ProductManager
          businessId={BUSINESS_ID}
          mode="resources"
          activeTab={currentView.id}
          onActiveTabChange={setCurrentDomainView}
          showResourceShell={false}
        />
      );
    }

    if (activeDomain === "clients" && currentView.id === "customers") {
      return <CustomerManager businessId={BUSINESS_ID} />;
    }

    if (activeDomain === "clients" && currentView.id === "ticketing") {
      return <TicketWalletManager businessId={BUSINESS_ID} />;
    }

    if (activeDomain === "analytics") {
      return (
        <ComingSoonWorkspace
          eyebrow="Analitica"
          title="Analitica independiente"
          description="La estructura ya queda separada del flujo financiero para que la siguiente fase mueva aqui tendencias, rentabilidad y lectura de negocio sin mezclar operacion con consulta."
          primaryActionLabel="Ir a Caja y Finanzas"
          onPrimaryAction={() => navigateToDomain("cash", "overview")}
        />
      );
    }

    return (
      <ComingSoonWorkspace
        eyebrow="Configuracion"
        title="Configuracion estructural"
        description="La nueva arquitectura ya reserva un dominio propio para seguridad, metodos de pago, mesas, roles y parametros generales. En la siguiente fase se movera aqui la configuracion real del sistema."
        primaryActionLabel="Ir a Centro de Recursos"
        onPrimaryAction={() => navigateToDomain("resources", "suppliers")}
      />
    );
  };

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
          {!isBooting &&
          cashLockInfo.blocked &&
          cashLockInfo.reason !== "no_open_session" ? (
            <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
                  Bloqueo de caja
                </p>
                <h2 className="mt-3 text-2xl font-black text-slate-950">
                  Cierra la jornada anterior
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {cashLockInfo.message}
                </p>
                <button
                  type="button"
                  onClick={() => navigateToDomain("cash", "overview")}
                  className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg"
                >
                  Ir a Caja y Finanzas
                </button>
              </div>
            </div>
          ) : null}

          <div className="mx-auto flex min-h-screen max-w-[1800px]">
            {isMobileSidebarOpen ? (
              <div className="fixed inset-0 z-40 lg:hidden">
                <div
                  className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                  onClick={() => setIsMobileSidebarOpen(false)}
                />
                <aside className="absolute inset-y-0 left-0 flex w-80 flex-col border-r border-emerald-900/15 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] px-5 py-6 text-white shadow-2xl">
                  <SmartProfitWordmark />
                  <p className="mt-5 text-sm text-slate-300">
                    Arquitectura modular basada en dominios operativos.
                  </p>

                  <nav className="mt-8 space-y-5">
                    {DOMAIN_GROUPS.map((group) => (
                      <div key={group.id}>
                        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                          {group.label}
                        </p>
                        <div className="grid gap-2">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeDomain === item.id;

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => navigateToDomain(item.id)}
                                className={`rounded-2xl border-l-4 px-4 py-3 text-left transition ${
                                  isActive
                                    ? "border-emerald-400 bg-emerald-500/10"
                                    : "border-transparent bg-white/6 hover:bg-white/10"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Icon size={18} strokeWidth={1.8} />
                                  <div>
                                    <p className="text-sm font-semibold text-white">{item.label}</p>
                                    <p className="text-xs text-slate-400">{item.description}</p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </nav>
                </aside>
              </div>
            ) : null}

            <aside
              className={`sticky top-0 z-40 hidden h-screen shrink-0 border-r border-emerald-950/10 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] py-6 text-white transition-all lg:flex lg:flex-col ${
                shellState.isSidebarCollapsed ? "w-24 px-3" : "w-80 px-5"
              }`}
            >
              <div className="rounded-[30px] border border-white/8 bg-white/6 p-5 shadow-xl backdrop-blur">
                <SmartProfitWordmark collapsed={shellState.isSidebarCollapsed} />
                {!shellState.isSidebarCollapsed ? (
                  <>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                      SmartProfit
                    </p>
                    <h1 className="mt-3 text-2xl font-black text-white">Shell por dominios</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Operacion, caja, recursos y clientes ahora viven en contextos separados.
                    </p>
                  </>
                ) : null}
              </div>

              <nav className="mt-6 space-y-5">
                {DOMAIN_GROUPS.map((group) => (
                  <div key={group.id}>
                    {!shellState.isSidebarCollapsed ? (
                      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                        {group.label}
                      </p>
                    ) : null}
                    <div className="grid gap-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeDomain === item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            title={item.label}
                            onClick={() => navigateToDomain(item.id)}
                            className={`flex items-center rounded-2xl border-l-4 py-3 text-left text-sm font-semibold transition ${
                              isActive
                                ? "border-emerald-400 bg-emerald-500/10 text-white"
                                : "border-transparent bg-white/6 text-slate-300 hover:bg-white/10"
                            } ${shellState.isSidebarCollapsed ? "justify-center px-2" : "gap-3 px-4"}`}
                          >
                            <Icon size={18} strokeWidth={1.8} />
                            {!shellState.isSidebarCollapsed ? item.label : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="mt-auto rounded-[28px] border border-[#d4a72c]/20 bg-[linear-gradient(135deg,rgba(212,167,44,0.16),rgba(15,23,42,0.15))] p-5 ring-1 ring-white/5">
                <div
                  className={`flex items-center ${
                    shellState.isSidebarCollapsed ? "justify-center" : "gap-3"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                    <SmartProfitIsotype className="h-7 w-7" />
                  </div>
                  {!shellState.isSidebarCollapsed ? (
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
                          setShellState((current) => ({
                            ...current,
                            isSidebarCollapsed: !current.isSidebarCollapsed,
                          }));
                        } else {
                          setIsMobileSidebarOpen(true);
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50"
                    >
                      {isDesktop ? (
                        shellState.isSidebarCollapsed ? (
                          <PanelLeftOpen size={18} />
                        ) : (
                          <PanelLeftClose size={18} />
                        )
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
                      {currentDomain.label}
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

              <div className="flex-1 px-4 py-6 pb-36 md:px-6 md:pb-40">
                <DomainHero
                  domain={currentDomain}
                  view={currentView}
                  onChangeView={setCurrentDomainView}
                />

                {renderDomainContent()}
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
