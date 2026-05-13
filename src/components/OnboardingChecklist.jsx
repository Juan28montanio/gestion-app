import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, CreditCard, Package, ReceiptText, Store, Utensils } from "lucide-react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { subscribeToPaymentMethods } from "../services/accountService";
import { subscribeToOpenCashSession, subscribeToCashClosings } from "../services/cashClosingService";
import { subscribeToProducts } from "../services/productService";
import { subscribeToSalesLedger } from "../services/salesLedgerService";
import { subscribeToTables } from "../services/tableService";

function normalizeText(value) {
  return String(value || "").trim();
}

export default function OnboardingChecklist({ businessId, activeSection, onNavigate }) {
  const [state, setState] = useState({
    products: [],
    tables: [],
    paymentMethods: [],
    openSession: null,
    closings: [],
    sales: [],
    dismissed: false,
  });

  useEffect(() => {
    if (!businessId) return undefined;

    const unsubscribers = [
      subscribeToProducts(businessId, (products) => setState((current) => ({ ...current, products }))),
      subscribeToTables(businessId, (tables) => setState((current) => ({ ...current, tables }))),
      subscribeToPaymentMethods(businessId, (paymentMethods) => setState((current) => ({ ...current, paymentMethods }))),
      subscribeToOpenCashSession(businessId, (openSession) => setState((current) => ({ ...current, openSession }))),
      subscribeToCashClosings(businessId, (closings) => setState((current) => ({ ...current, closings }))),
      subscribeToSalesLedger(businessId, (sales) => setState((current) => ({ ...current, sales }))),
      onSnapshot(doc(db, "onboardingProgress", businessId), (snapshot) => {
        setState((current) => ({ ...current, dismissed: Boolean(snapshot.data()?.dismissed) }));
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe?.());
  }, [businessId, setState]);

  const steps = useMemo(() => {
    const hasBusiness = Boolean(normalizeText(businessId));
    const hasPaymentMethod = state.paymentMethods.some((method) => method.active !== false);
    const hasSellingSurface = state.tables.some((table) => normalizeText(table.status) !== "inactive") || true;
    const hasProduct = state.products.some((product) => normalizeText(product.status || "active") === "active");
    const hasOpenOrClosedCash = Boolean(state.openSession) || state.closings.length > 0;
    const hasSale = state.sales.length > 0;
    const hasClosedCash = state.closings.some((closing) => normalizeText(closing.status) === "closed");

    return [
      {
        id: "business",
        label: "Negocio creado",
        empty: "Primero crea el negocio para guardar la operacion.",
        complete: hasBusiness,
        section: "account",
        icon: Store,
      },
      {
        id: "payments",
        label: "Medio de pago listo",
        empty: "Configura un medio de pago para empezar a cobrar.",
        complete: hasPaymentMethod,
        section: "account",
        icon: CreditCard,
      },
      {
        id: "surface",
        label: "Mesa o venta rapida",
        empty: "Crea una mesa o usa venta rapida para tomar pedidos.",
        complete: hasSellingSurface,
        section: "salon",
        icon: Utensils,
      },
      {
        id: "product",
        label: "Primer producto",
        empty: "Te falta crear un producto para vender.",
        complete: hasProduct,
        section: "inventory",
        icon: Package,
      },
      {
        id: "cash",
        label: "Caja abierta",
        empty: "Abre caja para empezar a cobrar.",
        complete: hasOpenOrClosedCash,
        section: "cash",
        icon: ReceiptText,
      },
      {
        id: "sale",
        label: "Primera venta registrada",
        empty: "Registra una venta para ver caja y utilidad diaria.",
        complete: hasSale,
        section: "pos",
        icon: CheckCircle2,
      },
      {
        id: "close",
        label: "Primer cierre",
        empty: "Cierra caja para validar efectivo esperado y diferencia.",
        complete: hasClosedCash,
        section: "cash",
        icon: ReceiptText,
      },
    ];
  }, [businessId, state]);

  const completedCount = steps.filter((step) => step.complete).length;
  const nextStep = steps.find((step) => !step.complete);

  useEffect(() => {
    if (!businessId) return;
    setDoc(doc(db, "onboardingProgress", businessId), {
      business_id: businessId,
      completedSteps: steps.filter((step) => step.complete).map((step) => step.id),
      nextStepId: nextStep?.id || "",
      completedAt: completedCount === steps.length ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    }, { merge: true }).catch(() => {});
  }, [businessId, completedCount, nextStep?.id, steps]);

  if (!businessId || state.dismissed || completedCount === steps.length || activeSection === "account") {
    return null;
  }

  return (
    <section className="mb-5 rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-950">Camino a la primera venta</p>
          <p className="mt-1 text-sm text-slate-500">
            {nextStep?.empty || "SmartProfit ya tiene la base operativa lista."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
            {completedCount}/{steps.length}
          </span>
          {nextStep ? (
            <button
              type="button"
              onClick={() => onNavigate?.(nextStep.section)}
              className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
            >
              Continuar
            </button>
          ) : null}
          <button
            type="button"
            onClick={() =>
              setDoc(doc(db, "onboardingProgress", businessId), {
                business_id: businessId,
                dismissed: true,
                dismissedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              }, { merge: true })
            }
            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
          >
            Ocultar
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-7">
        {steps.map((step) => {
          const Icon = step.complete ? CheckCircle2 : Circle;
          const StepIcon = step.icon;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onNavigate?.(step.section)}
              className={`flex min-h-[76px] items-start gap-2 rounded-2xl border px-3 py-3 text-left ${
                step.complete
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              <Icon size={16} className="mt-0.5 shrink-0" />
              <span>
                <span className="flex items-center gap-1 text-xs font-bold">
                  <StepIcon size={14} />
                  {step.label}
                </span>
                {!step.complete ? <span className="mt-1 block text-[11px] leading-4 opacity-75">{step.empty}</span> : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
