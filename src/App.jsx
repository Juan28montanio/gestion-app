import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ContactRound,
  LogOut,
  Menu,
  Package2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  ReceiptText,
  Ticket,
  UserCog,
  Wifi,
  WifiOff,
  Workflow,
} from "lucide-react";
import ToastViewport from "./components/ToastViewport";
import {
  getCashSessionLockInfo,
  subscribeToOpenCashSession,
} from "./services/cashClosingService";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuthContext } from "./context/AuthContext";
import LogoImage from "./components/LogoImage";
import { SmartProfitIsotype } from "./components/SmartProfitMark";

const POSOrder = lazy(() => import("./components/POSOrder"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const CustomerManager = lazy(() => import("./components/CustomerManager"));
const ProductManager = lazy(() => import("./components/ProductManager"));
const TableManager = lazy(() => import("./components/TableManager"));
const TicketWalletManager = lazy(() => import("./components/TicketWalletManager"));
const CustomerMenu = lazy(() => import("./components/CustomerMenu"));
const AccountSettings = lazy(() => import("./components/AccountSettings"));
const AuthScreen = lazy(() => import("./components/AuthScreen"));
const AuditPinModal = lazy(() => import("./components/AuditPinModal"));

const PAYMENT_METHOD_LABELS = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  nequi: "Nequi",
  daviplata: "Daviplata",
  ticket_wallet: "Tiquetera",
};

const NAV_ITEMS = [
  {
    id: "salon",
    label: "Salon",
    icon: PanelsTopLeft,
    section: "Operacion",
    description: "Mesas, ocupacion y flujo del salon.",
  },
  {
    id: "pos",
    label: "Punto de venta",
    icon: ReceiptText,
    section: "Operacion",
    description: "Toma pedidos y registra pagos.",
  },
  {
    id: "inventory",
    label: "Productos",
    icon: Package2,
    section: "Catalogo",
    description: "Carta comercial y productos vendidos.",
  },
  {
    id: "resources",
    label: "Recursos",
    icon: Workflow,
    section: "Catalogo",
    description: "Insumos, compras, proveedores y recetas.",
  },
  {
    id: "ticketing",
    label: "Ticketeras",
    icon: Ticket,
    section: "Control",
    description: "Planes prepagos y consumo por cliente.",
  },
  {
    id: "clients",
    label: "Clientes",
    icon: ContactRound,
    section: "Control",
    description: "Base de clientes y seguimiento comercial.",
  },
  {
    id: "finance",
    label: "Caja y finanzas",
    icon: BarChart3,
    section: "Control",
    description: "Caja, cierres, cartera e historial.",
  },
  {
    id: "account",
    label: "Cuenta",
    icon: UserCog,
    section: "Configuracion",
    description: "Datos del negocio y del administrador.",
  },
];

const SECTION_META = NAV_ITEMS.reduce((accumulator, item) => {
  accumulator[item.id] = {
    title: item.label,
    description: item.description,
  };
  return accumulator;
}, {});

const SECTION_GUIDANCE = {
  salon: {
    promise: "Ve la operacion mesa por mesa y detecta rapido que requiere accion.",
    workflow: "Revisa estado, abre pedido, da seguimiento y cobra sin perder contexto.",
  },
  pos: {
    promise: "Cobra rapido y con menos errores, incluso cuando el cliente paga en efectivo.",
    workflow: "Busca, agrega, cobra y confirma el cierre con una sola lectura clara.",
  },
  inventory: {
    promise: "Mantiene el catalogo listo para vender sin mezclarlo con tareas de abastecimiento.",
    workflow: "Actualiza productos, valida margen y conecta cada venta con su costo real.",
  },
  resources: {
    promise: "Convierte compras, insumos y recetas en decisiones de rentabilidad.",
    workflow: "Registra compras, revisa alertas y ajusta costo antes de tocar precios.",
  },
  ticketing: {
    promise: "Vende recurrencia y controla el saldo prepago sin perder trazabilidad.",
    workflow: "Crea planes, asigna saldo y revisa redenciones desde un solo flujo.",
  },
  clients: {
    promise: "Prioriza clientes valiosos, deuda pendiente y frecuencia de compra.",
    workflow: "Filtra, consulta historial y actua sobre oportunidades comerciales reales.",
  },
  finance: {
    promise: "Convierte la caja en una vista ejecutiva del negocio, no solo en un reporte.",
    workflow: "Mide resultado, revisa cartera y cierra la jornada con contexto financiero.",
  },
  account: {
    promise: "Mantiene identidad, responsables y datos del negocio en orden.",
    workflow: "Ajusta configuracion clave sin salir del entorno operativo.",
  },
};

function BusinessAvatar({ business, className = "h-11 w-11 rounded-2xl" }) {
  if (business?.logo_url) {
    return (
      <LogoImage
        url={business.logo_url}
        alt={business?.name || "Negocio"}
        className={className}
        imageClassName={`${className} object-contain bg-white p-1.5 ring-1 ring-slate-200`}
        fallbackClassName="ring-1 ring-slate-200"
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-[linear-gradient(180deg,#111827_0%,#1f2937_100%)] text-white ring-1 ring-slate-200 ${className}`}
    >
      <SmartProfitIsotype className="h-6 w-6" />
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#f4f6f8] px-6">
      <div className="w-full max-w-lg rounded-[32px] border border-slate-200 bg-white px-8 py-10 text-center shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex w-full justify-center">
          <img
            src="/smartprofit_logo.png"
            alt="SmartProfit"
            className="h-24 w-auto object-contain"
          />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          SmartProfit
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
          Preparando tu espacio de trabajo
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Estamos cargando el negocio, la caja y la informacion operativa.
        </p>
      </div>
    </div>
  );
}

function SectionFallback({ title = "Cargando modulo" }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        SmartProfit
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-5 grid gap-3">
        <div className="h-24 animate-pulse rounded-[24px] bg-slate-100" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-32 animate-pulse rounded-[24px] bg-slate-100" />
          <div className="h-32 animate-pulse rounded-[24px] bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function SidebarNav({
  activeSection,
  isCollapsed,
  navSections,
  onSelect,
}) {
  return (
    <nav
      className={`min-h-0 flex-1 overscroll-contain ${
        isCollapsed
          ? "overflow-hidden"
          : "sidebar-scroll overflow-x-hidden overflow-y-auto pr-1"
      }`}
    >
      <div className="grid gap-6 pb-4">
        {Object.entries(navSections).map(([sectionLabel, items]) => (
          <div key={sectionLabel} className="grid gap-2">
            {!isCollapsed ? (
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                {sectionLabel}
              </p>
            ) : null}

            <div className="grid gap-1.5">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`group flex items-center rounded-2xl border px-3 py-3 text-left transition ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                    } ${isCollapsed ? "justify-center" : "gap-3"}`}
                  >
                    <Icon size={18} strokeWidth={1.9} />
                    {!isCollapsed ? (
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-5">{item.label}</p>
                        <p
                          className={`text-xs leading-5 ${
                            isActive ? "text-slate-300" : "text-slate-400"
                          }`}
                        >
                          {item.description}
                        </p>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}

function AppShell() {
  const {
    currentUser,
    userProfile,
    business,
    businessId,
    isLoading,
    login,
    registerOwner,
    logout,
    verifySessionPassword,
    saveBusinessAccount,
    saveUserProfile,
    verifyAuditPin,
  } = useAuthContext();
  const [selectedTable, setSelectedTable] = useState(null);
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [toasts, setToasts] = useState([]);
  const [activeSection, setActiveSection] = useState("salon");
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const [isBooting, setIsBooting] = useState(true);
  const [openCashSession, setOpenCashSession] = useState(null);
  const [cashLockDismissed, setCashLockDismissed] = useState(false);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [auditChallenge, setAuditChallenge] = useState(null);

  useEffect(() => {
    const handleNavigation = () => setPathname(window.location.pathname);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);

    window.addEventListener("popstate", handleNavigation);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("resize", handleResize);

    const splashTimeout = window.setTimeout(() => setIsBooting(false), 900);

    return () => {
      window.removeEventListener("popstate", handleNavigation);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("resize", handleResize);
      window.clearTimeout(splashTimeout);
    };
  }, []);

  useEffect(() => {
    if (!businessId || !currentUser) {
      setOpenCashSession(null);
      return undefined;
    }

    const unsubscribe = subscribeToOpenCashSession(businessId, setOpenCashSession);
    return () => unsubscribe();
  }, [businessId, currentUser]);

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
  const shouldShowCashLockOverlay =
    cashLockInfo.blocked &&
    cashLockInfo.reason !== "no_open_session" &&
    activeSection !== "finance" &&
    !cashLockDismissed;

  useEffect(() => {
    if (!cashLockInfo.blocked || cashLockInfo.reason === "no_open_session") {
      setCashLockDismissed(false);
      return;
    }

    if (activeSection === "finance") {
      setCashLockDismissed(true);
    }
  }, [activeSection, cashLockInfo.blocked, cashLockInfo.reason]);

  useEffect(() => {
    if (cashLockInfo.reason === "previous_day_open" || cashLockInfo.reason === "too_long_open") {
      if (!openCashSession?.id) {
        setCashLockDismissed(false);
      }
    }
  }, [cashLockInfo.reason, openCashSession?.id]);

  const navSections = useMemo(() => {
    return NAV_ITEMS.reduce((accumulator, item) => {
      if (!accumulator[item.section]) {
        accumulator[item.section] = [];
      }
      accumulator[item.section].push(item);
      return accumulator;
    }, {});
  }, []);

  const userDisplayName =
    userProfile?.display_name || currentUser?.displayName || currentUser?.email || "Administrador";

  const currentSectionMeta = SECTION_META[activeSection] || {
    title: "Panel",
    description: "Consulta y administra la operacion del negocio.",
  };
  const currentSectionGuidance = SECTION_GUIDANCE[activeSection] || {
    promise: "Opera el sistema con una lectura limpia y enfocada.",
    workflow: "Usa este modulo para avanzar la jornada con menos friccion.",
  };

  useEffect(() => {
    document.title = menuRoute
      ? "SmartProfit | Menu digital"
      : `SmartProfit | ${business?.name || "SmartProfit"} | ${currentSectionMeta.title}`;
  }, [business?.name, currentSectionMeta.title, menuRoute]);

  const handleLogin = async ({ email, password }) => {
    setIsAuthBusy(true);
    try {
      await login(email, password);
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleRegister = async ({ businessName, adminName, email, password }) => {
    setIsAuthBusy(true);
    try {
      await registerOwner({ businessName, adminName, email, password });
    } finally {
      setIsAuthBusy(false);
    }
  };

  const requestAuditPin = ({ title, description }) =>
    new Promise((resolve) => {
      setAuditChallenge({ title, description, resolve });
    });

  const closeAuditChallenge = () => {
    if (auditChallenge?.resolve) {
      auditChallenge.resolve(false);
    }
    setAuditChallenge(null);
  };

  const verifyAuditChallenge = async (pin) => {
    const isValid = await verifyAuditPin(businessId, pin);
    if (isValid) {
      auditChallenge?.resolve?.(true);
      setAuditChallenge(null);
      return true;
    }

    return false;
  };

  if (menuRoute) {
    return (
      <>
        <Suspense fallback={<SplashScreen />}>
          <CustomerMenu businessId={menuRoute.businessId} tableId={menuRoute.tableId} />
        </Suspense>
        <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  if ((isLoading || isBooting) && !menuRoute) {
    return <SplashScreen />;
  }

  if (!currentUser) {
    return (
      <Suspense fallback={<SplashScreen />}>
        <AuthScreen onLogin={handleLogin} onRegister={handleRegister} isBusy={isAuthBusy} />
      </Suspense>
    );
  }

  return (
    <>
      <CartProvider>
        <main className="min-h-screen bg-[#f4f6f8] text-slate-900">
          {shouldShowCashLockOverlay ? (
            <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-7 shadow-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
                  Cierre pendiente
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-slate-950">
                  Debes cerrar la jornada anterior
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{cashLockInfo.message}</p>
                <button
                  type="button"
                  onClick={() => {
                    setCashLockDismissed(true);
                    setActiveSection("finance");
                  }}
                  className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Ir a caja y finanzas
                </button>
              </div>
            </div>
          ) : null}

          <div className="mx-auto flex min-h-screen max-w-[1800px]">
            {isMobileSidebarOpen ? (
              <div className="fixed inset-0 z-40 lg:hidden">
                <div
                  className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
                  onClick={() => setIsMobileSidebarOpen(false)}
                />

                <aside className="absolute inset-y-0 left-0 flex w-[min(86vw,340px)] flex-col overflow-hidden border-r border-slate-200 bg-[#f8fafc] px-4 py-4 shadow-2xl">
                  <div className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <BusinessAvatar business={business} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {business?.name || "SmartProfit"}
                      </p>
                      <p className="truncate text-xs text-slate-500">{userDisplayName}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white/70 p-3 shadow-sm">
                    <div className="mb-3 flex items-center justify-between border-b border-slate-100 px-2 pb-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Navegacion
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Desliza para ver todos los modulos.
                        </p>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-hidden">
                      <SidebarNav
                        activeSection={activeSection}
                        isCollapsed={false}
                        navSections={navSections}
                        onSelect={(sectionId) => {
                          setActiveSection(sectionId);
                          setIsMobileSidebarOpen(false);
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <LogOut size={18} />
                      Cerrar sesion
                    </button>
                  </div>
                </aside>
              </div>
            ) : null}

            <aside
              className={`sticky top-0 hidden h-screen shrink-0 overflow-hidden border-r border-slate-200 bg-[#f8fafc] transition-all lg:flex lg:flex-col ${
                isSidebarCollapsed ? "w-24 px-3 py-4" : "w-[308px] px-4 py-4"
              }`}
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div
                    className={`flex items-center ${
                      isSidebarCollapsed ? "justify-center" : "gap-3"
                    }`}
                  >
                    <BusinessAvatar business={business} />
                    {!isSidebarCollapsed ? (
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {business?.name || "SmartProfit"}
                        </p>
                        <p className="truncate text-xs text-slate-500">{userDisplayName}</p>
                      </div>
                    ) : null}
                  </div>

                  {!isSidebarCollapsed ? (
                    <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Espacio de trabajo
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Navega por ventas, recursos, caja y configuracion sin perder contexto.
                      </p>
                    </div>
                  ) : null}
                </div>

                <div
                  className={`mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white/70 shadow-sm ${
                    isSidebarCollapsed ? "p-2" : "p-3"
                  }`}
                >
                  {!isSidebarCollapsed ? (
                    <div className="mb-3 flex items-center justify-between border-b border-slate-100 px-2 pb-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Navegacion
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Desliza para ver todos los modulos.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="min-h-0 flex-1 overflow-hidden">
                    <SidebarNav
                      activeSection={activeSection}
                      isCollapsed={isSidebarCollapsed}
                      navSections={navSections}
                      onSelect={setActiveSection}
                    />
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={logout}
                    className={`flex w-full items-center rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 ${
                      isSidebarCollapsed ? "justify-center px-2" : "gap-3 px-4"
                    }`}
                  >
                    <LogOut size={18} />
                    {!isSidebarCollapsed ? "Cerrar sesion" : null}
                  </button>
                </div>
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-50 border-b border-slate-200 bg-[#f4f6f8]/95 px-4 py-4 backdrop-blur md:px-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isDesktop) {
                          setIsSidebarCollapsed((current) => !current);
                        } else {
                          setIsMobileSidebarOpen(true);
                        }
                      }}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                    >
                      {isDesktop ? (
                        isSidebarCollapsed ? (
                          <PanelLeftOpen size={18} />
                        ) : (
                          <PanelLeftClose size={18} />
                        )
                      ) : (
                        <Menu size={18} />
                      )}
                    </button>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        {business?.name || "SmartProfit"}
                      </p>
                      <h1 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-slate-950">
                        {currentSectionMeta.title}
                      </h1>
                      <p className="mt-1 max-w-2xl break-words text-sm leading-6 text-slate-500">
                        {currentSectionMeta.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                      {currentDateLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveSection("account")}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <UserCog size={14} />
                      {userDisplayName}
                    </button>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
                        isOnline
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-rose-200 bg-rose-50 text-rose-700"
                      }`}
                    >
                      {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                      {isOnline ? "Sincronizacion activa" : "Trabajando sin conexion"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
                  <article className="rounded-[24px] bg-white px-4 py-4 shadow-sm ring-1 ring-white/80 transition-transform duration-200 hover:-translate-y-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Enfoque del modulo
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                      {currentSectionGuidance.promise}
                    </p>
                  </article>
                  <article className="rounded-[24px] bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 shadow-sm ring-1 ring-slate-200 transition-transform duration-200 hover:-translate-y-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Flujo recomendado
                    </p>
                    <p className="mt-2 break-words text-sm leading-6 text-slate-600">
                      {currentSectionGuidance.workflow}
                    </p>
                  </article>
                </div>
              </header>

              <div className="flex-1 px-4 py-6 pb-28 md:px-6">
                <Suspense fallback={<SectionFallback title={currentSectionMeta.title} />}>
                  {activeSection === "salon" ? (
                    <TableManager
                      businessId={businessId}
                      selectedTableId={selectedTable?.id}
                      onSelectTable={setSelectedTable}
                      onNotify={notify}
                    />
                  ) : null}

                  {activeSection === "pos" ? (
                    <POSOrder
                      businessId={businessId}
                      selectedTable={selectedTable}
                      onSelectTable={setSelectedTable}
                      onOrderPaid={() => setSelectedTable(null)}
                      onOrderCancelled={() => {
                        notify("La orden fue cancelada y la mesa quedo libre.");
                        setSelectedTable(null);
                      }}
                      onPaymentSuccess={(paymentMethod) =>
                        notify(
                          `Pago registrado con ${
                            PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod
                          }.`
                        )
                      }
                    />
                  ) : null}

                  {activeSection === "inventory" ? (
                    <ProductManager businessId={businessId} mode="catalog" />
                  ) : null}

                  {activeSection === "resources" ? (
                    <ProductManager businessId={businessId} mode="resources" />
                  ) : null}

                  {activeSection === "ticketing" ? (
                    <TicketWalletManager businessId={businessId} requestAuditPin={requestAuditPin} />
                  ) : null}

                  {activeSection === "clients" ? <CustomerManager businessId={businessId} /> : null}

                  {activeSection === "finance" ? (
                    <AdminDashboard
                      businessId={businessId}
                      business={business}
                      userProfile={userProfile}
                      currentUser={currentUser}
                      requestAuditPin={requestAuditPin}
                    />
                  ) : null}

                  {activeSection === "account" ? (
                    <AccountSettings
                      business={business}
                      userProfile={userProfile}
                      currentUser={currentUser}
                      verifySessionPassword={verifySessionPassword}
                      onSaveBusiness={(values) => saveBusinessAccount(businessId, values)}
                      onSaveProfile={(values) => saveUserProfile(currentUser.uid, values)}
                    />
                  ) : null}
                </Suspense>
              </div>
            </div>
          </div>
        </main>
      </CartProvider>

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      <Suspense fallback={null}>
        <AuditPinModal
          open={Boolean(auditChallenge)}
          title={auditChallenge?.title || "Validar PIN"}
          description={auditChallenge?.description || "Confirma el PIN de auditoria."}
          onClose={closeAuditChallenge}
          onVerify={verifyAuditChallenge}
        />
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
