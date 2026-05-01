import { useEffect, useId, useMemo, useState } from "react";
import { Pencil, Plus, ShieldCheck, Ticket, WalletCards, X } from "lucide-react";
import {
  adjustCustomerTicketWallet,
  getTicketWalletState,
  subscribeToCustomers,
} from "../services/customerService";
import {
  createProduct,
  subscribeToProducts,
  updateProduct,
} from "../services/productService";
import { subscribeToSalesHistory } from "../services/financeService";
import FormInput from "./FormInput";
import ModalWrapper from "./ModalWrapper";
import { formatCOP } from "../utils/formatters";
import { useDecisionCenter } from "../app/decision-center/DecisionCenterContext";

function createEmptyPlanForm() {
  return {
    name: "",
    category: "Almuerzos",
    price: "",
    ticketUnits: "10",
    ticketValidityDays: "30",
  };
}

function createEmptyAssignmentForm() {
  return {
    customerId: "",
    units: "0",
    expiresAt: "",
  };
}

function getWalletHealth(wallet) {
  if (wallet.balance <= 0) {
    return {
      label: "Sin saldo",
      tone: "bg-slate-100 text-slate-700 ring-slate-200",
      action: "Conviene ofrecer recompra o reactivacion.",
    };
  }

  if (wallet.lowBalance) {
    return {
      label: "Saldo por renovar",
      tone: "bg-[#fff7df] text-[#946200] ring-[#d4a72c]/20",
      action: "Hay espacio para vender renovacion antes de que se agote.",
    };
  }

  return {
    label: "Saldo activo",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    action: "Mantener seguimiento para sostener frecuencia y redencion.",
  };
}

function buildPlanForm(plan) {
  if (!plan) {
    return createEmptyPlanForm();
  }

  return {
    name: plan.name || "",
    category: plan.category || "Almuerzos",
    price: String(plan.price ?? ""),
    ticketUnits: String(plan.ticket_units ?? 10),
    ticketValidityDays: String(plan.ticket_validity_days ?? 30),
  };
}

export default function TicketWalletManager({ businessId, requestAuditPin }) {
  const { publishSectionInsights, clearSectionInsights, openDecisionCenter } = useDecisionCenter();
  const assignmentCustomerId = useId();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [planForm, setPlanForm] = useState(createEmptyPlanForm);
  const [assignmentForm, setAssignmentForm] = useState(createEmptyAssignmentForm);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsCompactLayout(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const unsubscribeCustomers = subscribeToCustomers(businessId, setCustomers);
    const unsubscribeProducts = subscribeToProducts(businessId, setProducts);
    const unsubscribeSales = subscribeToSalesHistory(businessId, setSales);

    return () => {
      unsubscribeCustomers();
      unsubscribeProducts();
      unsubscribeSales();
    };
  }, [businessId]);

  const ticketPlans = useMemo(
    () => products.filter((product) => product.product_type === "ticket_wallet"),
    [products]
  );

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [customers, search]);

  const salesThisMonth = useMemo(() => {
    const now = new Date();
    return sales.filter((sale) => {
      const saleDate = sale.closed_at?.toDate ? sale.closed_at.toDate() : sale.createdAt?.toDate?.();
      return (
        saleDate &&
        saleDate.getMonth() === now.getMonth() &&
        saleDate.getFullYear() === now.getFullYear()
      );
    });
  }, [sales]);

  const ticketPurchases = useMemo(
    () => salesThisMonth.filter((sale) => Number(sale.ticket_units_granted || 0) > 0),
    [salesThisMonth]
  );
  const ticketRedemptions = useMemo(
    () => salesThisMonth.filter((sale) => Number(sale.ticket_units_consumed || 0) > 0),
    [salesThisMonth]
  );
  const ticketMovements = useMemo(
    () =>
      [...ticketPurchases, ...ticketRedemptions].sort((a, b) => {
        const aTime = a.closed_at?.toDate?.()?.getTime?.() || 0;
        const bTime = b.closed_at?.toDate?.()?.getTime?.() || 0;
        return bTime - aTime;
      }),
    [ticketPurchases, ticketRedemptions]
  );
  const walletSummary = useMemo(() => {
    const customersWithBalance = customers.filter(
      (customer) => getTicketWalletState(customer).balance > 0
    );
    const expiringSoon = customersWithBalance.filter((customer) => {
      const expiresAt = getTicketWalletState(customer).expiresAt;
      if (!expiresAt) {
        return false;
      }
      const diffDays = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length;
    const pendingDebt = customers.reduce(
      (sum, customer) => sum + Number(customer.pendingDebt || customer.debt_balance || 0),
      0
    );

    return {
      customersWithBalance: customersWithBalance.length,
      expiringSoon,
      pendingDebt,
      committedRevenue: ticketPurchases.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
      grantedUnits: ticketPurchases.reduce((sum, sale) => sum + Number(sale.ticket_units_granted || 0), 0),
      redeemedUnits: ticketRedemptions.reduce((sum, sale) => sum + Number(sale.ticket_units_consumed || 0), 0),
    };
  }, [customers, ticketPurchases, ticketRedemptions]);

  const redemptionRate = useMemo(() => {
    if (!walletSummary.grantedUnits) {
      return 0;
    }

    return (walletSummary.redeemedUnits / walletSummary.grantedUnits) * 100;
  }, [walletSummary.grantedUnits, walletSummary.redeemedUnits]);

  const ticketDecisionItems = useMemo(() => {
    const expiringCustomers = customers.filter((customer) => {
      const wallet = getTicketWalletState(customer);
      if (!wallet.expiresAt || wallet.balance <= 0) {
        return false;
      }
      const diffDays = Math.ceil((wallet.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    });
    const lowBalanceCustomers = customers.filter((customer) => {
      const wallet = getTicketWalletState(customer);
      return wallet.balance > 0 && wallet.lowBalance;
    });
    const topPlan = [...ticketPlans].sort((left, right) => Number(right.price || 0) - Number(left.price || 0))[0];

    return [
      {
        title: "Renovaciones cercanas",
        body: expiringCustomers.length
          ? `${expiringCustomers.length} cliente(s) tienen saldo por vencer en los proximos 7 dias. Es el mejor momento para renovar sin perder continuidad.`
          : "No hay saldos por vencer en la ventana inmediata. La base prepaga esta estable.",
        tone: expiringCustomers.length
          ? "bg-[#fff7df] text-[#7a5500] ring-[#d4a72c]/25"
          : "bg-emerald-50 text-emerald-900 ring-emerald-200",
        icon: "lightbulb",
      },
      {
        title: "Uso real del mes",
        body: walletSummary.grantedUnits
          ? `Se han redimido ${walletSummary.redeemedUnits} de ${walletSummary.grantedUnits} tickets otorgados, con una tasa de uso del ${redemptionRate.toFixed(0)}%.`
          : "Todavia no hay otorgamiento de tickets en el mes actual para medir comportamiento de uso.",
        tone: "bg-white text-slate-900 ring-slate-200",
        icon: "sparkles",
      },
      {
        title: "Clientes listos para recompra",
        body: lowBalanceCustomers.length
          ? `${lowBalanceCustomers.length} cliente(s) ya van en saldo bajo. Este grupo es prioridad natural para venta recurrente.`
          : "No hay clientes con saldo bajo por ahora, asi que la recompra inmediata no es la tension principal.",
        tone: "bg-slate-50 text-slate-900 ring-slate-200",
        icon: "lightbulb",
      },
      {
        title: "Plan de mayor valor",
        body: topPlan
          ? `${topPlan.name} es el plan de mayor precio con ${formatCOP(topPlan.price || 0)} y ${topPlan.ticket_units || 0} ticket(s). Vale la pena medir si tambien es el mas facil de redimir y renovar.`
          : "Aun no hay planes creados para comparar valor y facilidad de recompra.",
        tone: "bg-white text-slate-900 ring-slate-200",
        icon: "sparkles",
      },
    ];
  }, [
    customers,
    redemptionRate,
    ticketPlans,
    walletSummary.grantedUnits,
    walletSummary.redeemedUnits,
  ]);

  const ticketDecisionSummary = useMemo(() => {
    if (walletSummary.expiringSoon > 0) {
      return `${walletSummary.expiringSoon} ticketera(s) por vencer y ${walletSummary.customersWithBalance} cliente(s) con saldo activo ya merecen seguimiento comercial en un solo panel.`;
    }

    if (walletSummary.committedRevenue > 0) {
      return `Las ticketeras ya aportan ${formatCOP(walletSummary.committedRevenue)} en venta recurrente del mes y el analisis queda mejor concentrado fuera de la vista operativa.`;
    }

    return "El modulo queda mas limpio para operar planes y el seguimiento de recompra vive en el centro de decisiones.";
  }, [
    walletSummary.committedRevenue,
    walletSummary.customersWithBalance,
    walletSummary.expiringSoon,
  ]);

  useEffect(() => {
    publishSectionInsights("ticketing", {
      eyebrow: "Ticketeras",
      title: "Venta recurrente y renovacion",
      summary: ticketDecisionSummary,
      items: ticketDecisionItems,
    });

    return () => clearSectionInsights("ticketing");
  }, [
    clearSectionInsights,
    publishSectionInsights,
    ticketDecisionItems,
    ticketDecisionSummary,
  ]);

  const handleSavePlan = async (event) => {
    event.preventDefault();
    const normalizedName = String(planForm.name || "").trim();
    const price = Number(planForm.price);
    const ticketUnits = Number(planForm.ticketUnits);
    const ticketValidityDays = Number(planForm.ticketValidityDays);

    if (!normalizedName) {
      return;
    }

    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(ticketUnits) || ticketUnits <= 0 || !Number.isFinite(ticketValidityDays) || ticketValidityDays <= 0) {
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: normalizedName,
        category: String(planForm.category || "Almuerzos").trim() || "Almuerzos",
        price,
        stock: 9999,
        productType: "ticket_wallet",
        ticketUnits,
        ticketValidityDays,
      };

      if (editingPlanId) {
        await updateProduct(editingPlanId, businessId, payload);
      } else {
        await createProduct(businessId, payload);
      }

      setIsPlanModalOpen(false);
      setEditingPlanId(null);
      setPlanForm(createEmptyPlanForm());
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignTickets = async (event) => {
    event.preventDefault();
    const units = Number(assignmentForm.units);

    if (!assignmentForm.customerId) {
      return;
    }

    if (!Number.isFinite(units) || units < 0) {
      return;
    }

    setIsSaving(true);
    try {
      await adjustCustomerTicketWallet(assignmentForm.customerId, {
        units,
        totalPurchased: units,
        expiresAt: assignmentForm.expiresAt ? new Date(`${assignmentForm.expiresAt}T00:00:00`) : null,
      });
      setIsAssignmentModalOpen(false);
      setAssignmentForm(createEmptyAssignmentForm());
    } finally {
      setIsSaving(false);
    }
  };

  const openAssignmentModal = async (customer = null) => {
    if (requestAuditPin) {
      const isAuthorized = await requestAuditPin({
        title: "Validar PIN de auditoria",
        description: "Confirma el PIN para ajustar saldo de ticketera.",
      });

      if (!isAuthorized) {
        return;
      }
    }

    setAssignmentForm({
      customerId: customer?.id || "",
      units: String(customer?.ticket_balance_units ?? 0),
      expiresAt: customer?.ticket_expires_at?.toDate
        ? customer.ticket_expires_at.toDate().toISOString().slice(0, 10)
        : "",
    });
    setIsAssignmentModalOpen(true);
  };

  return (
    <section className="space-y-6">
      <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Planes prepago</h2>
            <p className="text-sm text-slate-500">
              Controla planes activos, clientes con saldo, deuda pendiente y tickets por vencer.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
            <button
              type="button"
              onClick={() => {
                setEditingPlanId(null);
                setPlanForm(createEmptyPlanForm());
                setIsPlanModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg"
            >
              <Plus size={16} />
              Nuevo plan
            </button>
            <button
              type="button"
              onClick={() => openAssignmentModal()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d4a72c]/30 bg-[#fff7df] px-4 py-3 text-sm font-semibold text-[#946200]"
            >
              <WalletCards size={16} />
              Ajustar saldo
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <article className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Planes activos</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{ticketPlans.length}</p>
          </article>
          <article className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Clientes con saldo</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{walletSummary.customersWithBalance}</p>
          </article>
          <article className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tickets por vencer</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{walletSummary.expiringSoon}</p>
          </article>
          <article className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Deuda pendiente</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{formatCOP(walletSummary.pendingDebt)}</p>
          </article>
          <article className="rounded-[24px] bg-slate-950 p-5 text-white ring-1 ring-slate-900">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Redenciones del mes</p>
            <p className="mt-2 text-2xl font-black">{ticketRedemptions.length}</p>
          </article>
        </div>

        <div className="mt-5 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Centro de decisiones
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{ticketDecisionSummary}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold ${
                  ticketDecisionItems.length > 0
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {ticketDecisionItems.length} lectura{ticketDecisionItems.length === 1 ? "" : "s"} activa{ticketDecisionItems.length === 1 ? "" : "s"}
              </div>
              <button
                type="button"
                onClick={openDecisionCenter}
                disabled={ticketDecisionItems.length === 0}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  ticketDecisionItems.length > 0
                    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                Ver panel
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <article className="rounded-[24px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] p-5 text-white ring-1 ring-slate-900/10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Venta recurrente del mes
            </p>
            <p className="mt-2 text-3xl font-black">{formatCOP(walletSummary.committedRevenue)}</p>
            <p className="mt-2 text-sm text-slate-300">
              Ingreso comprometido por compra de planes prepago en el mes actual.
            </p>
          </article>
          <article className="rounded-[24px] bg-white p-5 ring-1 ring-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Tasa de uso
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">{redemptionRate.toFixed(0)}%</p>
            <p className="mt-2 text-sm text-slate-500">
              {walletSummary.redeemedUnits} tickets usados de {walletSummary.grantedUnits} otorgados este mes.
            </p>
          </article>
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Planes de ticketera</h3>
              <p className="text-sm text-slate-500">Configura paquetes prepagos claros y faciles de vender.</p>
            </div>
          </div>

          <div className="space-y-3">
            {ticketPlans.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                <p className="text-base font-semibold text-slate-700">Aun no hay planes creados</p>
                <p className="mt-2 text-sm text-slate-500">
                  Crea planes prepago para acelerar ventas recurrentes y control de saldo.
                </p>
              </div>
            ) : null}

            {ticketPlans.map((plan) => (
              <div key={plan.id} className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{plan.name}</p>
                    <p className="break-words text-sm text-slate-500">
                      {plan.ticket_units || 0} tickets · {plan.ticket_validity_days || 30} dias
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPlanId(plan.id);
                      setPlanForm(buildPlanForm(plan));
                      setIsPlanModalOpen(true);
                    }}
                    className="rounded-2xl bg-white p-2.5 text-slate-700 ring-1 ring-slate-200"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Precio</p>
                    <p className="mt-2 font-mono text-lg font-bold text-slate-950">{formatCOP(plan.price)}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Categoria</p>
                    <p className="mt-2 font-semibold text-slate-900">{plan.category || "Sin categoria"}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Argumento comercial</p>
                  <p className="mt-2 text-sm text-slate-700">
                    Cada ticket queda en{" "}
                    <span className="font-semibold text-slate-900">
                      {formatCOP((Number(plan.price || 0) || 0) / Math.max(Number(plan.ticket_units || 0) || 1, 1))}
                    </span>{" "}
                    y ayuda a asegurar recurrencia con vigencia de {plan.ticket_validity_days || 30} dias.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Clientes con saldo</h3>
              <p className="text-sm text-slate-500">Consulta vigencia, deuda y saldo disponible por cliente.</p>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente..."
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-slate-200 lg:w-[280px]"
            />
          </div>

          <div className="space-y-3">
            {filteredCustomers.map((customer) => {
              const wallet = getTicketWalletState(customer);
              const walletHealth = getWalletHealth(wallet);
              return (
                <div key={customer.id} className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{customer.name}</p>
                      <p className="break-words text-sm text-slate-500">
                        Saldo {wallet.balance} · Vence{" "}
                        {wallet.expiresAt ? wallet.expiresAt.toLocaleDateString("es-CO") : "sin fecha"}
                      </p>
                      {Number(customer.pendingDebt || customer.debt_balance || 0) > 0 ? (
                        <p className="mt-2 text-xs font-semibold text-rose-700">
                          Deuda pendiente: {formatCOP(customer.pendingDebt || customer.debt_balance || 0)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 sm:max-w-[220px] sm:justify-end">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${walletHealth.tone}`}>
                        {walletHealth.label}
                      </span>
                      <span className="rounded-full bg-[#fff7df] px-3 py-1 text-xs font-semibold text-[#946200] ring-1 ring-[#d4a72c]/20">
                        {wallet.balance} tickets
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Siguiente accion</p>
                    <p className="mt-2 text-sm text-slate-700">{walletHealth.action}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAssignmentModal(customer)}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <ShieldCheck size={14} />
                    Ajustar saldo
                  </button>
                </div>
              );
            })}

            {filteredCustomers.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                No hay clientes que coincidan con la busqueda actual.
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Historial global del mes</h3>
            <p className="text-sm text-slate-500">Revisa compras de planes y redenciones desde una sola tabla.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
            {ticketMovements.length} movimientos
          </span>
        </div>
        {isCompactLayout ? (
          <div className="mt-4 space-y-3">
            {ticketMovements.map((sale) => (
              <article key={sale.id} className="rounded-[22px] bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{sale.customer_name || "Cliente"}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {Number(sale.ticket_units_granted || 0) > 0 ? "Compra de plan" : "Redencion"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCOP(sale.total || 0)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {(sale.items || []).map((item) => item.name).join(", ") || sale.concept}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Unidades: {Number(sale.ticket_units_granted || 0) || Number(sale.ticket_units_consumed || 0)}
                  </span>
                  <span>
                    {sale.closed_at?.toDate?.()?.toLocaleDateString("es-CO") || "Sin fecha"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="py-3 pr-4">Cliente</th>
                <th className="py-3 pr-4">Movimiento</th>
                <th className="py-3 pr-4">Detalle</th>
                <th className="py-3 pr-4 text-right">Unidades</th>
                <th className="py-3 pr-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {ticketMovements.map((sale) => (
                  <tr key={sale.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3 pr-4">{sale.customer_name || "Cliente"}</td>
                    <td className="py-3 pr-4">
                      {Number(sale.ticket_units_granted || 0) > 0 ? "Compra de plan" : "Redencion"}
                    </td>
                    <td className="py-3 pr-4">
                      {(sale.items || []).map((item) => item.name).join(", ") || sale.concept}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono">
                      {Number(sale.ticket_units_granted || 0) || Number(sale.ticket_units_consumed || 0)}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono">{formatCOP(sale.total || 0)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        )}
      </section>

      <ModalWrapper
        open={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        maxWidthClass="max-w-3xl"
        icon={{ main: <Ticket size={20} />, close: <X size={18} /> }}
        title={editingPlanId ? "Editar plan de ticketera" : "Nuevo plan de ticketera"}
        description="Define paquetes prepagos con su precio, cantidad de tickets y vigencia."
      >
        <form onSubmit={handleSavePlan} className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Nombre del plan"
              required
              value={planForm.name}
              onChange={(event) => setPlanForm((current) => ({ ...current, name: event.target.value }))}
            />
            <FormInput
              label="Categoria"
              value={planForm.category}
              onChange={(event) =>
                setPlanForm((current) => ({ ...current, category: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FormInput
              label="Precio"
              type="number"
              min="0"
              step="1"
              value={planForm.price}
              onChange={(event) => setPlanForm((current) => ({ ...current, price: event.target.value }))}
            />
            <FormInput
              label="Tickets"
              type="number"
              min="1"
              step="1"
              value={planForm.ticketUnits}
              onChange={(event) =>
                setPlanForm((current) => ({ ...current, ticketUnits: event.target.value }))
              }
            />
            <FormInput
              label="Vigencia (dias)"
              type="number"
              min="1"
              step="1"
              value={planForm.ticketValidityDays}
              onChange={(event) =>
                setPlanForm((current) => ({ ...current, ticketValidityDays: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(false)}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                isSaving ||
                !String(planForm.name || "").trim() ||
                Number(planForm.price) <= 0 ||
                Number(planForm.ticketUnits) <= 0 ||
                Number(planForm.ticketValidityDays) <= 0
              }
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : editingPlanId ? "Actualizar plan" : "Crear plan"}
            </button>
          </div>
        </form>
      </ModalWrapper>

      <ModalWrapper
        open={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        maxWidthClass="max-w-3xl"
        icon={{ main: <WalletCards size={20} />, close: <X size={18} /> }}
        title="Ajustar saldo de ticketera"
        description="Usa esta herramienta para migrar clientes antiguos o corregir el saldo disponible."
      >
        <form onSubmit={handleAssignTickets} className="grid gap-6">
          <div className="grid gap-2 text-sm font-medium text-slate-700">
            <label htmlFor={assignmentCustomerId}>Cliente</label>
            <select
              id={assignmentCustomerId}
              value={assignmentForm.customerId}
              onChange={(event) =>
                setAssignmentForm((current) => ({ ...current, customerId: event.target.value }))
              }
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Seleccionar cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Saldo disponible"
              type="number"
              min="0"
              step="1"
              value={assignmentForm.units}
              onChange={(event) =>
                setAssignmentForm((current) => ({ ...current, units: event.target.value }))
              }
            />
            <FormInput
              label="Vencimiento"
              type="date"
              value={assignmentForm.expiresAt}
              onChange={(event) =>
                setAssignmentForm((current) => ({ ...current, expiresAt: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setIsAssignmentModalOpen(false)}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                isSaving ||
                !assignmentForm.customerId ||
                Number.isNaN(Number(assignmentForm.units)) ||
                Number(assignmentForm.units) < 0
              }
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Guardar ajuste"}
            </button>
          </div>
        </form>
      </ModalWrapper>
    </section>
  );
}
