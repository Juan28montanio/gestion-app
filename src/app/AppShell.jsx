import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import ToastViewport from "../components/ToastViewport";
import {
  getCashSessionLockInfo,
  subscribeToOpenCashSession,
} from "../services/cashClosingService";
import { CartProvider } from "../context/CartContext";
import { useAuthContext } from "../context/AuthContext";
import {
  NAV_ITEMS,
  PAYMENT_METHOD_LABELS,
  SECTION_GUIDANCE,
  SECTION_META,
} from "./navigation/navigationConfig";
import SplashScreen from "./layout/SplashScreen";
import SectionFallback from "./layout/SectionFallback";
import SectionErrorBoundary from "./layout/SectionErrorBoundary";
import MainHeader from "./layout/MainHeader";
import MobileBottomNav from "./layout/MobileBottomNav";
import DesktopSidebar from "./layout/DesktopSidebar";
import MobileSidebarDrawer from "./layout/MobileSidebarDrawer";
import CashLockOverlay from "./layout/CashLockOverlay";
import { DecisionCenterProvider, useDecisionCenter } from "./decision-center/DecisionCenterContext";
import DecisionCenterDrawer from "./decision-center/DecisionCenterDrawer";

const CHUNK_RELOAD_KEY = "smartprofit:chunk-reload";

function isChunkLoadError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return (
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("failed to load resource") ||
    message.includes("importing a module script failed")
  );
}

function lazyWithChunkRecovery(importer) {
  return lazy(() =>
    importer()
      .then((module) => {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
        return module;
      })
      .catch((error) => {
        if (isChunkLoadError(error) && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
          window.location.reload();
          return new Promise(() => {});
        }

        throw error;
      })
  );
}

const POSOrder = lazyWithChunkRecovery(() => import("../components/POSOrder"));
const AdminDashboard = lazyWithChunkRecovery(() => import("../components/AdminDashboard"));
const CustomerManager = lazyWithChunkRecovery(() => import("../components/CustomerManager"));
const ProductManager = lazyWithChunkRecovery(() => import("../components/ProductManager"));
const TableManager = lazyWithChunkRecovery(() => import("../components/TableManager"));
const TicketWalletManager = lazyWithChunkRecovery(() => import("../components/TicketWalletManager"));
const CustomerMenu = lazyWithChunkRecovery(() => import("../components/CustomerMenu"));
const AccountSettings = lazyWithChunkRecovery(() => import("../components/AccountSettings"));
const UsageGuide = lazyWithChunkRecovery(() => import("../components/UsageGuide"));
const AuthScreen = lazyWithChunkRecovery(() => import("../components/AuthScreen"));
const AuditPinModal = lazyWithChunkRecovery(() => import("../components/AuditPinModal"));

function AppShellContent() {
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
    resetWorkspace,
  } = useAuthContext();
  const [selectedTable, setSelectedTable] = useState(null);
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [toasts, setToasts] = useState([]);
  const [activeSection, setActiveSection] = useState("salon");
  const [resourceInitialTab, setResourceInitialTab] = useState("");
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isWideDesktop, setIsWideDesktop] = useState(() => window.innerWidth >= 1280);
  const [isBooting, setIsBooting] = useState(true);
  const [openCashSession, setOpenCashSession] = useState(null);
  const [cashLockDismissed, setCashLockDismissed] = useState(false);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [auditChallenge, setAuditChallenge] = useState(null);
  const [sectionRenderNonce, setSectionRenderNonce] = useState(0);
  const { entriesBySection, isOpen: isDecisionCenterOpen, openDecisionCenter, closeDecisionCenter } = useDecisionCenter();

  useEffect(() => {
    const handleNavigation = () => setPathname(window.location.pathname);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleResize = () => setIsWideDesktop(window.innerWidth >= 1280);

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

  useEffect(() => {
    if (/^\/preparaciones(\/|$)/i.test(pathname)) {
      window.history.replaceState({}, "", "/fichas-tecnicas");
      setPathname("/fichas-tecnicas");
      setActiveSection("resources");
      setResourceInitialTab("recipes");
      return;
    }

    if (/^\/fichas-tecnicas(\/|$)/i.test(pathname)) {
      setActiveSection("resources");
      setResourceInitialTab("recipes");
    }
  }, [pathname]);

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
  const currentDecisionEntry = entriesBySection[activeSection] || null;
  const decisionCount = Array.isArray(currentDecisionEntry?.items) ? currentDecisionEntry.items.length : 0;

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

  const handleToggleNavigation = () => {
    if (isWideDesktop) {
      setIsSidebarCollapsed((current) => !current);
    } else {
      setIsMobileSidebarOpen(true);
    }
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
            <CashLockOverlay
              cashLockInfo={cashLockInfo}
              onGoFinance={() => {
                setCashLockDismissed(true);
                setActiveSection("finance");
              }}
            />
          ) : null}

          <div className="mx-auto flex min-h-screen max-w-[1800px]">
            <MobileSidebarDrawer
              open={isMobileSidebarOpen}
              business={business}
              userDisplayName={userDisplayName}
              activeSection={activeSection}
              navSections={navSections}
              onSelect={setActiveSection}
              onClose={() => setIsMobileSidebarOpen(false)}
              onLogout={logout}
            />

            <DesktopSidebar
              business={business}
              userDisplayName={userDisplayName}
              activeSection={activeSection}
              isCollapsed={isSidebarCollapsed}
              navSections={navSections}
              onSelect={setActiveSection}
              onLogout={logout}
            />

            <div className="flex min-w-0 flex-1 flex-col">
              <MainHeader
                business={business}
                currentDateLabel={currentDateLabel}
                currentSectionMeta={currentSectionMeta}
                currentSectionGuidance={currentSectionGuidance}
                decisionCount={decisionCount}
                isOnline={isOnline}
                isSidebarCollapsed={isSidebarCollapsed}
                isWideDesktop={isWideDesktop}
                userDisplayName={userDisplayName}
                onOpenDecisionCenter={openDecisionCenter}
                onToggleNavigation={handleToggleNavigation}
                onGoAccount={() => setActiveSection("account")}
              />

              <div className="flex-1 px-4 py-6 pb-36 md:px-6 xl:pb-28">
                <SectionErrorBoundary
                  key={`${activeSection}-${sectionRenderNonce}`}
                  resetKey={`${activeSection}-${sectionRenderNonce}`}
                  title={`No fue posible cargar ${currentSectionMeta.title}`}
                  description="Revisa el modulo nuevamente o vuelve a una vista segura para seguir operando mientras solucionamos el fallo."
                  onRetry={() => setSectionRenderNonce((current) => current + 1)}
                  onGoSafeSection={() => setActiveSection("account")}
                >
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
                        onOpenCatalog={() => setActiveSection("inventory")}
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
                      <ProductManager
                        businessId={businessId}
                        mode="resources"
                        initialTab={resourceInitialTab}
                      />
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
                        onResetWorkspace={() => resetWorkspace(businessId)}
                        onGoGuide={() => setActiveSection("guide")}
                      />
                    ) : null}

                    {activeSection === "guide" ? (
                      <UsageGuide
                        business={business}
                        onNavigate={(section) => setActiveSection(section)}
                      />
                    ) : null}
                  </Suspense>
                </SectionErrorBoundary>
              </div>
            </div>
          </div>

          <MobileBottomNav
            activeSection={activeSection}
            onSelect={setActiveSection}
            onOpenMenu={() => setIsMobileSidebarOpen(true)}
          />
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
      <DecisionCenterDrawer
        open={isDecisionCenterOpen}
        currentEntry={currentDecisionEntry}
        onClose={closeDecisionCenter}
      />
    </>
  );
}

export default function AppShell() {
  return (
    <DecisionCenterProvider>
      <AppShellContent />
    </DecisionCenterProvider>
  );
}
