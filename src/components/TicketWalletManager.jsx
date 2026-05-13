import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  ClipboardList,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Ticket,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";
import {
  createCustomer,
  subscribeToCustomers,
  updateCustomer,
} from "../services/customerService";
import {
  adjustMealTicketBalance,
  cancelTicketConsumption,
  consumeMealTicket,
  registerExistingMealTicket,
  saveTicketPlan,
  sellMealTicket,
  subscribeToMealTickets,
  subscribeToTicketConsumptions,
  subscribeToTicketPlans,
  updateMealTicketStatus,
} from "../services/mealTicketService";
import { subscribeToProducts } from "../services/productService";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import ModalWrapper from "./ModalWrapper";
import { formatCOP } from "../utils/formatters";
import {
  TICKET_STATUS,
  calculateExpirationDate,
  calculateMealsAvailable,
  calculatePricePerMeal,
  calculateTicketStatus,
  canConsumeTicket,
  normalizeDate,
} from "../utils/ticketing";
import { PAYMENT_OPTIONS } from "../features/pos/posHelpers";

const TABS = [
  { id: "customers", label: "Clientes" },
  { id: "tickets", label: "Ticketeras" },
  { id: "consumptions", label: "Consumos" },
  { id: "plans", label: "Planes" },
];

const CUSTOMER_TYPES = [
  { value: "student", label: "Estudiante" },
  { value: "worker", label: "Trabajador" },
  { value: "company", label: "Empresa" },
  { value: "general", label: "General" },
];

const CUSTOMER_TYPE_LABELS = {
  student: "Estudiante",
  worker: "Trabajador",
  company: "Empresa",
  general: "General",
};

const TICKET_STATUS_LABELS = {
  active: "Activa",
  exhausted: "Agotada",
  expired: "Vencida",
  canceled: "Anulada",
  suspended: "Suspendida",
};

const CONSUMPTION_STATUS_LABELS = {
  valid: "Valido",
  canceled: "Anulado",
};

function createCustomerForm(customer = {}) {
  return {
    name: customer.name || "",
    phone: customer.phone || "",
    document: customer.document || customer.document_id || "",
    email: customer.email || "",
    institution: customer.institution || "",
    program: customer.program || "",
    customerType: customer.customerType || customer.customer_type || "student",
    status: customer.status || "active",
    notes: customer.notes || "",
  };
}

function createPlanForm(plan = {}) {
  return {
    name: plan.name || "",
    mealsIncluded: String(plan.mealsIncluded ?? plan.meals_included ?? 10),
    price: String(plan.price ?? ""),
    validityDays: String(plan.validityDays ?? plan.validity_days ?? 30),
    status: plan.status || "active",
    description: plan.description || "",
  };
}

function createSaleForm(customer = null, plan = null) {
  const mealsPurchased = Number(plan?.mealsIncluded ?? plan?.meals_included ?? 10);
  const amountPaid = Number(plan?.price ?? 0);
  const expirationDate = calculateExpirationDate(new Date(), Number(plan?.validityDays ?? plan?.validity_days ?? 30));
  return {
    registrationMode: "sale",
    customerId: customer?.id || "",
    planId: plan?.id || "",
    customSale: plan ? "plan" : "custom",
    mealsPurchased: String(mealsPurchased || 10),
    amountPaid: String(amountPaid || ""),
    paymentMethod: "cash",
    validityDays: String(plan?.validityDays ?? plan?.validity_days ?? 30),
    expirationDate: expirationDate ? expirationDate.toISOString().slice(0, 10) : "",
    mealsConsumed: "0",
    purchaseDate: "",
    migrationReason: "",
    notes: "",
  };
}

function createConsumeForm(ticket = null) {
  return {
    ticketId: ticket?.id || "",
    productId: "",
    productName: "Almuerzo",
    notes: "",
  };
}

function statusBadge(status) {
  const normalizedStatus = String(status || "active");
  if (normalizedStatus === "active" || normalizedStatus === "valid") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (normalizedStatus === "suspended") {
    return "bg-amber-50 text-amber-800 ring-amber-200";
  }
  if (normalizedStatus === "expired" || normalizedStatus === "exhausted") {
    return "bg-slate-100 text-slate-700 ring-slate-200";
  }
  return "bg-rose-50 text-rose-700 ring-rose-200";
}

function formatDate(value) {
  const date = normalizeDate(value);
  return date ? date.toLocaleDateString("es-CO") : "-";
}

function buildActor(currentUser, userProfile) {
  return {
    id: currentUser?.uid || "",
    name: userProfile?.display_name || currentUser?.displayName || currentUser?.email || "Operador SmartProfit",
    email: currentUser?.email || "",
  };
}

export default function TicketWalletManager({
  businessId,
  requestAuditPin,
  currentUser,
  userProfile,
}) {
  const [activeTab, setActiveTab] = useState("customers");
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [customerModal, setCustomerModal] = useState({ open: false, id: "", form: createCustomerForm() });
  const [planModal, setPlanModal] = useState({ open: false, id: "", form: createPlanForm() });
  const [saleModal, setSaleModal] = useState({ open: false, form: createSaleForm() });
  const [consumeModal, setConsumeModal] = useState({ open: false, form: createConsumeForm() });
  const [cancelConsumptionModal, setCancelConsumptionModal] = useState({ open: false, consumption: null, reason: "" });
  const [ticketStatusModal, setTicketStatusModal] = useState({ open: false, ticket: null, status: "", reason: "" });
  const [adjustModal, setAdjustModal] = useState({ open: false, ticket: null, balance: "", reason: "" });

  const actor = useMemo(() => buildActor(currentUser, userProfile), [currentUser, userProfile]);

  useEffect(() => {
    const unsubscribers = [
      subscribeToCustomers(businessId, setCustomers),
      subscribeToTicketPlans(businessId, setPlans),
      subscribeToMealTickets(businessId, setTickets),
      subscribeToTicketConsumptions(businessId, setConsumptions),
      subscribeToProducts(businessId, setProducts),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [businessId]);

  const enrichedCustomers = useMemo(() => {
    return customers.map((customer) => {
      const customerTickets = tickets.filter((ticket) => ticket.customer_id === customer.id);
      const customerConsumptions = consumptions.filter(
        (consumption) => consumption.customer_id === customer.id && consumption.status !== "canceled"
      );
      const activeBalance = customerTickets
        .filter((ticket) => calculateTicketStatus(ticket) === TICKET_STATUS.ACTIVE)
        .reduce((sum, ticket) => sum + calculateMealsAvailable(ticket), 0);
      const lastVisit = customerConsumptions[0]?.consumed_at || customerConsumptions[0]?.consumedAt || null;

      return { ...customer, activeBalance, lastVisit, ticketCount: customerTickets.length };
    });
  }, [consumptions, customers, tickets]);

  const activeTickets = useMemo(
    () => tickets.filter((ticket) => calculateTicketStatus(ticket) === TICKET_STATUS.ACTIVE),
    [tickets]
  );

  const ticketSummary = useMemo(() => {
    const activeBalance = activeTickets.reduce((sum, ticket) => sum + calculateMealsAvailable(ticket), 0);
    const expiringSoon = activeTickets.filter((ticket) => {
      const expirationDate = normalizeDate(ticket.expiration_date || ticket.expirationDate);
      if (!expirationDate) {
        return false;
      }
      const diffDays = Math.ceil((expirationDate.getTime() - Date.now()) / 86400000);
      return diffDays >= 0 && diffDays <= 7;
    }).length;
    const ticketIncome = tickets.reduce((sum, ticket) => sum + Number(ticket.amount_paid || ticket.amountPaid || 0), 0);
    return {
      customers: customers.length,
      activeTickets: activeTickets.length,
      activeBalance,
      expiringSoon,
      ticketIncome,
      canceledConsumptions: consumptions.filter((consumption) => consumption.status === "canceled").length,
    };
  }, [activeTickets, consumptions, customers.length, tickets]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return enrichedCustomers.filter((customer) =>
      [customer.name, customer.phone, customer.document, customer.email, customer.institution]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [enrichedCustomers, search]);

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tickets.filter((ticket) =>
      [ticket.customer_name, ticket.plan_name, ticket.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [search, tickets]);

  const filteredConsumptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return consumptions.filter((consumption) =>
      [consumption.customer_name, consumption.product_name, consumption.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [consumptions, search]);

  const lunchProducts = useMemo(
    () => products.filter((product) => product.ticket_eligible || /almuerzo|menu/i.test(`${product.name} ${product.category}`)),
    [products]
  );

  const selectedSalePlan = plans.find((plan) => plan.id === saleModal.form.planId) || null;
  const selectedSaleCustomer = customers.find((customer) => customer.id === saleModal.form.customerId) || null;

  const requireAudit = async (title, description) => {
    if (!requestAuditPin) {
      return true;
    }
    return requestAuditPin({ title, description });
  };

  const runAction = async (action, successMessage = "") => {
    setSaving(true);
    setFeedback("");
    try {
      await action();
      setFeedback(successMessage);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible completar la accion.");
    } finally {
      setSaving(false);
    }
  };

  const saveCustomer = async (event) => {
    event.preventDefault();
    await runAction(async () => {
      if (customerModal.id) {
        await updateCustomer(customerModal.id, businessId, customerModal.form);
      } else {
        const duplicated = customers.find((customer) => {
          const samePhone = customerModal.form.phone && customer.phone === customerModal.form.phone;
          const sameDocument = customerModal.form.document && (customer.document || customer.document_id) === customerModal.form.document;
          return samePhone || sameDocument;
        });
        if (duplicated) {
          throw new Error("Ya existe un cliente con ese celular o documento.");
        }
        await createCustomer(businessId, customerModal.form);
      }
      setCustomerModal({ open: false, id: "", form: createCustomerForm() });
    }, "Cliente guardado.");
  };

  const savePlan = async (event) => {
    event.preventDefault();
    await runAction(async () => {
      await saveTicketPlan(businessId, planModal.form, planModal.id);
      setPlanModal({ open: false, id: "", form: createPlanForm() });
    }, "Plan guardado.");
  };

  const sellTicket = async (event) => {
    event.preventDefault();
    await runAction(async () => {
      const payload = {
        ...saleModal.form,
        customerName: selectedSaleCustomer?.name || "",
        planName: selectedSalePlan?.name || (saleModal.form.registrationMode === "migration" ? "Saldo inicial" : "Personalizada"),
        validityDays: Number(saleModal.form.validityDays || selectedSalePlan?.validity_days || 0),
      };

      if (saleModal.form.registrationMode === "migration") {
        const authorized = await requireAudit(
          "Validar saldo inicial",
          "Confirma el PIN para cargar ticketeras pagadas antes de usar el sistema."
        );
        if (!authorized) {
          throw new Error("Operacion cancelada por falta de autorizacion.");
        }

        await registerExistingMealTicket(businessId, payload, actor);
        setSaleModal({ open: false, form: createSaleForm() });
        setActiveTab("tickets");
        return;
      }

      await sellMealTicket(
        businessId,
        payload,
        actor
      );
      setSaleModal({ open: false, form: createSaleForm() });
      setActiveTab("tickets");
    }, saleModal.form.registrationMode === "migration" ? "Saldo inicial cargado sin afectar caja." : "Venta de ticketera registrada en caja.");
  };

  const consumeTicket = async (event) => {
    event.preventDefault();
    const selectedProduct = products.find((product) => product.id === consumeModal.form.productId);
    await runAction(async () => {
      await consumeMealTicket(
        businessId,
        {
          ...consumeModal.form,
          productName: selectedProduct?.name || consumeModal.form.productName || "Almuerzo",
        },
        actor
      );
      setConsumeModal({ open: false, form: createConsumeForm() });
      setActiveTab("consumptions");
    }, "Consumo registrado y saldo descontado.");
  };

  const cancelConsumption = async () => {
    await runAction(async () => {
      await cancelTicketConsumption(cancelConsumptionModal.consumption.id, cancelConsumptionModal.reason, actor);
      setCancelConsumptionModal({ open: false, consumption: null, reason: "" });
    }, "Consumo anulado y saldo devuelto.");
  };

  const changeTicketStatus = async () => {
    await runAction(async () => {
      await updateMealTicketStatus(
        ticketStatusModal.ticket.id,
        ticketStatusModal.status,
        ticketStatusModal.reason,
        actor
      );
      setTicketStatusModal({ open: false, ticket: null, status: "", reason: "" });
    }, "Estado de ticketera actualizado.");
  };

  const adjustBalance = async () => {
    const authorized = await requireAudit(
      "Validar ajuste de saldo",
      "Confirma el PIN para ajustar manualmente una ticketera."
    );
    if (!authorized) {
      return;
    }
    await runAction(async () => {
      await adjustMealTicketBalance(adjustModal.ticket.id, Number(adjustModal.balance), adjustModal.reason, actor);
      setAdjustModal({ open: false, ticket: null, balance: "", reason: "" });
    }, "Saldo ajustado con auditoria.");
  };

  const openSaleModal = (customer = null) => {
    setSaleModal({ open: true, form: createSaleForm(customer, null) });
  };

  const openConsumeModal = (ticket = null) => {
    setConsumeModal({ open: true, form: createConsumeForm(ticket) });
  };

  return (
    <section className="space-y-6">
      <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Clientes y Ticketeras</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Controla clientes recurrentes, planes prepagos, venta de almuerzos por adelantado y consumo con trazabilidad.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
            <button
              type="button"
              onClick={() => setCustomerModal({ open: true, id: "", form: createCustomerForm() })}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg"
            >
              <Plus size={16} />
              Cliente
            </button>
            <button
              type="button"
              onClick={() => openSaleModal()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg"
            >
              <WalletCards size={16} />
              Vender ticketera
            </button>
            <button
              type="button"
              onClick={() => setSaleModal({ open: true, form: { ...createSaleForm(), registrationMode: "migration", customSale: "custom", paymentMethod: "legacy_paid" } })}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
            >
              <ShieldAlert size={16} />
              Saldo inicial
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["Clientes", ticketSummary.customers],
            ["Ticketeras activas", ticketSummary.activeTickets],
            ["Almuerzos pendientes", ticketSummary.activeBalance],
            ["Por vencer", ticketSummary.expiringSoon],
            ["Ingresos ticketera", formatCOP(ticketSummary.ticketIncome)],
            ["Consumos anulados", ticketSummary.canceledConsumptions],
          ].map(([label, value]) => (
            <article key={label} className="rounded-[22px] bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
              <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] bg-white/85 p-5 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <div className="mb-5 grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  activeTab === tab.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
            <Search size={16} className="text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por cliente, celular, documento o estado..."
              className="w-full min-w-0 bg-transparent text-sm outline-none"
            />
          </div>
          {feedback ? (
            <span className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
              {feedback}
            </span>
          ) : null}
        </div>

        {activeTab === "customers" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="py-3 pr-4">Cliente</th>
                  <th className="py-3 pr-4">Contacto</th>
                  <th className="py-3 pr-4">Institucion</th>
                  <th className="py-3 pr-4">Tipo</th>
                  <th className="py-3 pr-4 text-right">Saldo</th>
                  <th className="py-3 pr-4">Ultima visita</th>
                  <th className="py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3 pr-4 font-semibold text-slate-950">{customer.name}</td>
                    <td className="py-3 pr-4">{[customer.phone, customer.document].filter(Boolean).join(" / ") || "-"}</td>
                    <td className="py-3 pr-4">{customer.institution || "-"}</td>
                    <td className="py-3 pr-4">{CUSTOMER_TYPE_LABELS[customer.customer_type] || customer.customer_type || "General"}</td>
                    <td className="py-3 pr-4 text-right font-mono">{customer.activeBalance}</td>
                    <td className="py-3 pr-4">{formatDate(customer.lastVisit)}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setCustomerModal({ open: true, id: customer.id, form: createCustomerForm(customer) })}
                          className="rounded-xl bg-slate-100 p-2 text-slate-700"
                          title="Editar cliente"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openSaleModal(customer)}
                          className="rounded-xl bg-emerald-50 p-2 text-emerald-700"
                          title="Vender ticketera"
                        >
                          <Ticket size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {activeTab === "tickets" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredTickets.map((ticket) => {
              const derivedStatus = calculateTicketStatus(ticket);
              const available = calculateMealsAvailable(ticket);
              const consumptionPermission = canConsumeTicket(ticket);
              return (
                <article key={ticket.id} className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{ticket.customer_name}</p>
                      <p className="mt-1 text-sm text-slate-500">{ticket.plan_name || "Personalizada"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadge(derivedStatus)}`}>
                      {TICKET_STATUS_LABELS[derivedStatus] || derivedStatus}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <Metric label="Saldo" value={available} />
                    <Metric label="Consumidos" value={Number(ticket.meals_consumed || 0)} />
                    <Metric label="Comprados" value={Number(ticket.meals_purchased || 0)} />
                    <Metric label="Pagado" value={formatCOP(ticket.amount_paid || 0)} />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Metric label="Vencimiento" value={formatDate(ticket.expiration_date)} />
                    <Metric label="Precio almuerzo" value={formatCOP(ticket.price_per_meal || 0)} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openConsumeModal(ticket)}
                      disabled={!consumptionPermission.allowed}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Utensils size={15} />
                      Consumir
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustModal({ open: true, ticket, balance: String(available), reason: "" })}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                    >
                      <ShieldAlert size={15} />
                      Ajustar
                    </button>
                    {derivedStatus === TICKET_STATUS.SUSPENDED ? (
                      <button
                        type="button"
                        onClick={() => setTicketStatusModal({ open: true, ticket, status: TICKET_STATUS.ACTIVE, reason: "Reactivacion autorizada" })}
                        className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200"
                      >
                        Reactivar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTicketStatusModal({ open: true, ticket, status: TICKET_STATUS.SUSPENDED, reason: "" })}
                        className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-amber-700 ring-1 ring-amber-200"
                      >
                        Suspender
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setTicketStatusModal({ open: true, ticket, status: TICKET_STATUS.CANCELED, reason: "" })}
                      className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-200"
                    >
                      <Ban size={15} />
                      Anular
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {activeTab === "consumptions" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="py-3 pr-4">Fecha</th>
                  <th className="py-3 pr-4">Cliente</th>
                  <th className="py-3 pr-4">Producto</th>
                  <th className="py-3 pr-4">Usuario</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsumptions.map((consumption) => (
                  <tr key={consumption.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3 pr-4">{formatDate(consumption.consumed_at || consumption.createdAt)}</td>
                    <td className="py-3 pr-4 font-semibold text-slate-950">{consumption.customer_name}</td>
                    <td className="py-3 pr-4">{consumption.product_name || "Almuerzo"}</td>
                    <td className="py-3 pr-4">{consumption.consumed_by?.name || "-"}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadge(consumption.status)}`}>
                        {CONSUMPTION_STATUS_LABELS[consumption.status] || consumption.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setCancelConsumptionModal({ open: true, consumption, reason: "" })}
                        disabled={consumption.status === "canceled"}
                        className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <RotateCcw size={15} />
                        Anular
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {activeTab === "plans" ? (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <button
              type="button"
              onClick={() => setPlanModal({ open: true, id: "", form: createPlanForm() })}
              className="flex min-h-[170px] flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-slate-600"
            >
              <Plus size={22} />
              <span className="font-semibold">Crear plan</span>
            </button>
            {plans.map((plan) => (
              <article key={plan.id} className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">{plan.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{plan.description || "Plan de almuerzos prepagos"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadge(plan.status)}`}>
                    {plan.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Metric label="Almuerzos" value={plan.meals_included || plan.mealsIncluded} />
                  <Metric label="Precio" value={formatCOP(plan.price)} />
                  <Metric label="Unidad" value={formatCOP(plan.price_per_meal || calculatePricePerMeal(plan.price, plan.meals_included))} />
                </div>
                <button
                  type="button"
                  onClick={() => setPlanModal({ open: true, id: plan.id, form: createPlanForm(plan) })}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                >
                  <Pencil size={15} />
                  Editar plan
                </button>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <CustomerFormModal
        modal={customerModal}
        setModal={setCustomerModal}
        onSubmit={saveCustomer}
        saving={saving}
      />
      <PlanFormModal modal={planModal} setModal={setPlanModal} onSubmit={savePlan} saving={saving} />
      <SellTicketModal
        modal={saleModal}
        setModal={setSaleModal}
        customers={customers}
        plans={plans.filter((plan) => plan.status === "active")}
        selectedPlan={selectedSalePlan}
        onSubmit={sellTicket}
        saving={saving}
      />
      <ConsumeTicketModal
        modal={consumeModal}
        setModal={setConsumeModal}
        tickets={activeTickets}
        products={lunchProducts}
        onSubmit={consumeTicket}
        saving={saving}
      />
      <ReasonModal
        open={cancelConsumptionModal.open}
        title="Anular consumo"
        description="El saldo se devolvera a la ticketera y quedara trazabilidad del motivo."
        icon={<RotateCcw size={20} />}
        reason={cancelConsumptionModal.reason}
        onReasonChange={(reason) => setCancelConsumptionModal((current) => ({ ...current, reason }))}
        onClose={() => setCancelConsumptionModal({ open: false, consumption: null, reason: "" })}
        onConfirm={cancelConsumption}
        confirmLabel="Anular consumo"
        saving={saving}
      />
      <ReasonModal
        open={ticketStatusModal.open}
        title={
          ticketStatusModal.status === TICKET_STATUS.CANCELED
            ? "Anular ticketera"
            : ticketStatusModal.status === TICKET_STATUS.SUSPENDED
              ? "Suspender ticketera"
              : "Reactivar ticketera"
        }
        description="La ticketera no se borrara fisicamente. El cambio queda auditado."
        icon={<Ban size={20} />}
        reason={ticketStatusModal.reason}
        onReasonChange={(reason) => setTicketStatusModal((current) => ({ ...current, reason }))}
        onClose={() => setTicketStatusModal({ open: false, ticket: null, status: "", reason: "" })}
        onConfirm={changeTicketStatus}
        confirmLabel="Confirmar"
        saving={saving}
      />
      <AdjustBalanceModal
        modal={adjustModal}
        setModal={setAdjustModal}
        onConfirm={adjustBalance}
        saving={saving}
      />
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function CustomerFormModal({ modal, setModal, onSubmit, saving }) {
  return (
    <ModalWrapper
      open={modal.open}
      onClose={() => setModal({ open: false, id: "", form: createCustomerForm() })}
      maxWidthClass="max-w-4xl"
      icon={{ main: <ClipboardList size={20} />, close: <X size={18} /> }}
      title={modal.id ? "Editar cliente" : "Nuevo cliente"}
      description="Registra datos comerciales suficientes para operar ticketera y seguimiento."
    >
      <form onSubmit={onSubmit} className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Nombre completo" required value={modal.form.name} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, name: event.target.value } }))} />
          <FormInput label="Celular" value={modal.form.phone} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, phone: event.target.value } }))} />
          <FormInput label="Documento" value={modal.form.document} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, document: event.target.value } }))} />
          <FormInput label="Correo" type="email" value={modal.form.email} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, email: event.target.value } }))} />
          <FormInput label="Institucion educativa" value={modal.form.institution} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, institution: event.target.value } }))} />
          <FormInput label="Carrera o programa" value={modal.form.program} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, program: event.target.value } }))} />
          <FormSelect label="Tipo" value={modal.form.customerType} options={CUSTOMER_TYPES} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, customerType: event.target.value } }))} />
          <FormSelect label="Estado" value={modal.form.status} options={[{ value: "active", label: "Activo" }, { value: "inactive", label: "Inactivo" }]} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, status: event.target.value } }))} />
        </div>
        <FormInput label="Observaciones" multiline rows={3} value={modal.form.notes} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, notes: event.target.value } }))} />
        <ModalActions saving={saving} submitLabel={modal.id ? "Actualizar cliente" : "Crear cliente"} onCancel={() => setModal({ open: false, id: "", form: createCustomerForm() })} />
      </form>
    </ModalWrapper>
  );
}

function PlanFormModal({ modal, setModal, onSubmit, saving }) {
  return (
    <ModalWrapper
      open={modal.open}
      onClose={() => setModal({ open: false, id: "", form: createPlanForm() })}
      icon={{ main: <Ticket size={20} />, close: <X size={18} /> }}
      title={modal.id ? "Editar plan" : "Nuevo plan"}
      description="Define cantidad de almuerzos, precio y vigencia comercial."
    >
      <form onSubmit={onSubmit} className="grid gap-5">
        <FormInput label="Nombre" required value={modal.form.name} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, name: event.target.value } }))} />
        <div className="grid gap-4 md:grid-cols-3">
          <FormInput label="Almuerzos incluidos" type="number" min="1" required value={modal.form.mealsIncluded} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, mealsIncluded: event.target.value } }))} />
          <FormInput label="Precio" type="number" min="0" required value={modal.form.price} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, price: event.target.value } }))} />
          <FormInput label="Vigencia dias" type="number" min="1" value={modal.form.validityDays} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, validityDays: event.target.value } }))} />
        </div>
        <FormSelect label="Estado" value={modal.form.status} options={[{ value: "active", label: "Activo" }, { value: "inactive", label: "Inactivo" }]} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, status: event.target.value } }))} />
        <FormInput label="Descripcion" multiline rows={3} value={modal.form.description} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, description: event.target.value } }))} />
        <ModalActions saving={saving} submitLabel={modal.id ? "Actualizar plan" : "Crear plan"} onCancel={() => setModal({ open: false, id: "", form: createPlanForm() })} />
      </form>
    </ModalWrapper>
  );
}

function SellTicketModal({ modal, setModal, customers, plans, selectedPlan, onSubmit, saving }) {
  useEffect(() => {
    if (!modal.open || modal.form.customSale !== "plan" || !selectedPlan) {
      return;
    }
    const expirationDate = calculateExpirationDate(new Date(), selectedPlan.validity_days || selectedPlan.validityDays);
    setModal((current) => ({
      ...current,
      form: {
        ...current.form,
        mealsPurchased: String(selectedPlan.meals_included || selectedPlan.mealsIncluded || 0),
        amountPaid: String(selectedPlan.price || 0),
        validityDays: String(selectedPlan.validity_days || selectedPlan.validityDays || ""),
        expirationDate: expirationDate ? expirationDate.toISOString().slice(0, 10) : "",
      },
    }));
  }, [modal.form.customSale, modal.open, selectedPlan, setModal]);

  return (
    <ModalWrapper
      open={modal.open}
      onClose={() => setModal({ open: false, form: createSaleForm() })}
      maxWidthClass="max-w-4xl"
      icon={{ main: <WalletCards size={20} />, close: <X size={18} /> }}
      title={modal.form.registrationMode === "migration" ? "Cargar saldo inicial" : "Vender ticketera"}
      description={
        modal.form.registrationMode === "migration"
          ? "Registra ticketeras ya pagadas antes de usar el sistema. No afecta caja ni ventas actuales."
          : "Registra el ingreso en caja sin descontar inventario."
      }
    >
      <form onSubmit={onSubmit} className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setModal((current) => ({ ...current, form: { ...current.form, registrationMode: "sale", paymentMethod: "cash" } }))}
            className={`rounded-3xl px-5 py-4 text-left ring-1 ${
              modal.form.registrationMode === "sale"
                ? "bg-emerald-50 text-emerald-900 ring-emerald-300"
                : "bg-slate-50 text-slate-600 ring-slate-200"
            }`}
          >
            <p className="text-sm font-semibold">Venta actual</p>
            <p className="mt-1 text-sm">Entra a caja y queda en reportes financieros.</p>
          </button>
          <button
            type="button"
            onClick={() => setModal((current) => ({ ...current, form: { ...current.form, registrationMode: "migration", customSale: "custom", paymentMethod: "legacy_paid" } }))}
            className={`rounded-3xl px-5 py-4 text-left ring-1 ${
              modal.form.registrationMode === "migration"
                ? "bg-amber-50 text-amber-900 ring-amber-300"
                : "bg-slate-50 text-slate-600 ring-slate-200"
            }`}
          >
            <p className="text-sm font-semibold">Saldo inicial</p>
            <p className="mt-1 text-sm">Para pagos hechos antes de existir el sistema.</p>
          </button>
        </div>
        <FormSelect label="Cliente" required value={modal.form.customerId} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, customerId: event.target.value } }))}>
          <option value="">Seleccionar cliente</option>
          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
        </FormSelect>
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect label="Tipo de venta" value={modal.form.customSale} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, customSale: event.target.value, planId: "" } }))}>
            <option value="plan">Plan configurado</option>
            <option value="custom">Personalizada</option>
          </FormSelect>
          {modal.form.customSale === "plan" ? (
            <FormSelect label="Plan" value={modal.form.planId} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, planId: event.target.value } }))}>
              <option value="">Seleccionar plan</option>
              {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
            </FormSelect>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <FormInput label="Almuerzos" type="number" min="1" required value={modal.form.mealsPurchased} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, mealsPurchased: event.target.value } }))} />
          <FormInput label={modal.form.registrationMode === "migration" ? "Valor historico" : "Valor pagado"} type="number" min="0" required={modal.form.registrationMode !== "migration"} value={modal.form.amountPaid} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, amountPaid: event.target.value } }))} />
          {modal.form.registrationMode === "migration" ? (
            <FormInput label="Ya consumidos" type="number" min="0" value={modal.form.mealsConsumed} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, mealsConsumed: event.target.value } }))} />
          ) : (
            <FormSelect label="Metodo de pago" required value={modal.form.paymentMethod} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, paymentMethod: event.target.value } }))}>
              {PAYMENT_OPTIONS.filter((option) => option.value !== "ticket_wallet" && option.value !== "account_credit").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </FormSelect>
          )}
          <FormInput label="Vencimiento" type="date" value={modal.form.expirationDate} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, expirationDate: event.target.value } }))} />
        </div>
        {modal.form.registrationMode === "migration" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="Fecha de compra historica" type="date" value={modal.form.purchaseDate} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, purchaseDate: event.target.value } }))} />
            <FormInput label="Motivo de carga" required value={modal.form.migrationReason} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, migrationReason: event.target.value } }))} />
          </div>
        ) : null}
        <Metric label="Precio por almuerzo" value={formatCOP(calculatePricePerMeal(modal.form.amountPaid, modal.form.mealsPurchased))} />
        <FormInput label="Notas" multiline rows={3} value={modal.form.notes} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, notes: event.target.value } }))} />
        <ModalActions saving={saving} submitLabel={modal.form.registrationMode === "migration" ? "Cargar saldo inicial" : "Registrar venta"} onCancel={() => setModal({ open: false, form: createSaleForm() })} />
      </form>
    </ModalWrapper>
  );
}

function ConsumeTicketModal({ modal, setModal, tickets, products, onSubmit, saving }) {
  const selectedTicket = tickets.find((ticket) => ticket.id === modal.form.ticketId);
  return (
    <ModalWrapper
      open={modal.open}
      onClose={() => setModal({ open: false, form: createConsumeForm() })}
      icon={{ main: <Utensils size={20} />, close: <X size={18} /> }}
      title="Consumir almuerzo"
      description="Este evento descuenta saldo y queda preparado para inventario/ficha tecnica."
    >
      <form onSubmit={onSubmit} className="grid gap-5">
        <FormSelect label="Ticketera activa" required value={modal.form.ticketId} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, ticketId: event.target.value } }))}>
          <option value="">Seleccionar ticketera</option>
          {tickets.map((ticket) => <option key={ticket.id} value={ticket.id}>{ticket.customer_name} - saldo {calculateMealsAvailable(ticket)}</option>)}
        </FormSelect>
        {selectedTicket ? <Metric label="Saldo disponible" value={calculateMealsAvailable(selectedTicket)} /> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect label="Producto entregado" value={modal.form.productId} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, productId: event.target.value } }))}>
            <option value="">Almuerzo generico</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </FormSelect>
          <FormInput label="Nombre producto" value={modal.form.productName} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, productName: event.target.value } }))} />
        </div>
        <FormInput label="Notas" multiline rows={3} value={modal.form.notes} onChange={(event) => setModal((current) => ({ ...current, form: { ...current.form, notes: event.target.value } }))} />
        <ModalActions saving={saving} submitLabel="Confirmar consumo" onCancel={() => setModal({ open: false, form: createConsumeForm() })} />
      </form>
    </ModalWrapper>
  );
}

function ReasonModal({ open, title, description, icon, reason, onReasonChange, onClose, onConfirm, confirmLabel, saving }) {
  return (
    <ModalWrapper open={open} onClose={onClose} icon={{ main: icon, close: <X size={18} /> }} title={title} description={description}>
      <div className="grid gap-5">
        <FormInput label="Motivo" required multiline rows={4} value={reason} onChange={(event) => onReasonChange(event.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={onClose} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={saving || !String(reason || "").trim()} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Procesando..." : confirmLabel}</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function AdjustBalanceModal({ modal, setModal, onConfirm, saving }) {
  return (
    <ModalWrapper
      open={modal.open}
      onClose={() => setModal({ open: false, ticket: null, balance: "", reason: "" })}
      icon={{ main: <ShieldAlert size={20} />, close: <X size={18} /> }}
      title="Ajustar saldo"
      description="Solo para migraciones o correcciones autorizadas. Requiere PIN de auditoria."
    >
      <div className="grid gap-5">
        <Metric label="Ticketera" value={modal.ticket?.customer_name || "-"} />
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Saldo actual" readOnly value={modal.ticket ? calculateMealsAvailable(modal.ticket) : ""} />
          <FormInput label="Nuevo saldo" type="number" min="0" required value={modal.balance} onChange={(event) => setModal((current) => ({ ...current, balance: event.target.value }))} />
        </div>
        <FormInput label="Motivo" required multiline rows={4} value={modal.reason} onChange={(event) => setModal((current) => ({ ...current, reason: event.target.value }))} />
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setModal({ open: false, ticket: null, balance: "", reason: "" })} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={saving || !String(modal.reason || "").trim()} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Guardando..." : "Ajustar saldo"}</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function ModalActions({ saving, submitLabel, onCancel }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={onCancel} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">Cancelar</button>
      <button type="submit" disabled={saving} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Guardando..." : submitLabel}</button>
    </div>
  );
}
