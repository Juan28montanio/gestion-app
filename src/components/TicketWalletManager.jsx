import { useEffect, useId, useMemo, useState } from "react";
import { Pencil, Plus, Ticket, WalletCards, X } from "lucide-react";
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

const EMPTY_PLAN_FORM = {
  name: "",
  category: "Almuerzos",
  price: "",
  ticketUnits: "10",
  ticketValidityDays: "30",
};

const EMPTY_ASSIGNMENT_FORM = {
  customerId: "",
  units: "0",
  expiresAt: "",
};

function buildPlanForm(plan) {
  if (!plan) {
    return EMPTY_PLAN_FORM;
  }

  return {
    name: plan.name || "",
    category: plan.category || "Almuerzos",
    price: String(plan.price ?? ""),
    ticketUnits: String(plan.ticket_units ?? 10),
    ticketValidityDays: String(plan.ticket_validity_days ?? 30),
  };
}

export default function TicketWalletManager({ businessId }) {
  const assignmentCustomerId = useId();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [planForm, setPlanForm] = useState(EMPTY_PLAN_FORM);
  const [assignmentForm, setAssignmentForm] = useState(EMPTY_ASSIGNMENT_FORM);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      [customer.name, customer.phone, customer.email].filter(Boolean).join(" ").toLowerCase().includes(term)
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

  const handleSavePlan = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name: planForm.name,
        category: planForm.category,
        price: Number(planForm.price),
        stock: 9999,
        productType: "ticket_wallet",
        ticketUnits: Number(planForm.ticketUnits),
        ticketValidityDays: Number(planForm.ticketValidityDays),
      };

      if (editingPlanId) {
        await updateProduct(editingPlanId, businessId, payload);
      } else {
        await createProduct(businessId, payload);
      }

      setIsPlanModalOpen(false);
      setEditingPlanId(null);
      setPlanForm(EMPTY_PLAN_FORM);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignTickets = async (event) => {
    event.preventDefault();
    if (!assignmentForm.customerId) {
      return;
    }

    setIsSaving(true);
    try {
      await adjustCustomerTicketWallet(assignmentForm.customerId, {
        units: Number(assignmentForm.units),
        totalPurchased: Number(assignmentForm.units),
        expiresAt: assignmentForm.expiresAt ? new Date(`${assignmentForm.expiresAt}T00:00:00`) : null,
      });
      setIsAssignmentModalOpen(false);
      setAssignmentForm(EMPTY_ASSIGNMENT_FORM);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Centro de Ticketeras</h2>
            <p className="text-sm text-slate-500">
              Controla planes prepagos, saldos iniciales y redenciones del mes.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingPlanId(null);
                setPlanForm(EMPTY_PLAN_FORM);
                setIsPlanModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
            >
              <Plus size={16} />
              Nuevo plan
            </button>
            <button
              type="button"
              onClick={() => setIsAssignmentModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#d4a72c]/30 bg-[#fff7df] px-4 py-2.5 text-sm font-semibold text-[#946200]"
            >
              <WalletCards size={16} />
              Asignar saldo inicial
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Planes activos</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{ticketPlans.length}</p>
          </article>
          <article className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Compras del mes</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{ticketPurchases.length}</p>
          </article>
          <article className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tickets redimidos</p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {ticketRedemptions.reduce((sum, sale) => sum + Number(sale.ticket_units_consumed || 0), 0)}
            </p>
          </article>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Planes de tiquetera</h3>
          </div>
          <div className="space-y-3">
            {ticketPlans.map((plan) => (
              <div key={plan.id} className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{plan.name}</p>
                    <p className="text-sm text-slate-500">
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
                <p className="mt-3 font-mono text-lg font-bold text-slate-950">{formatCOP(plan.price)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Clientes con saldo</h3>
              <p className="text-sm text-slate-500">Consulta vigencia y saldo disponible por cliente.</p>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente..."
              className="rounded-2xl bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-slate-200"
            />
          </div>
          <div className="space-y-3">
            {filteredCustomers.map((customer) => {
              const wallet = getTicketWalletState(customer);
              return (
                <div key={customer.id} className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{customer.name}</p>
                      <p className="text-sm text-slate-500">
                        Saldo {wallet.balance} · Vence{" "}
                        {wallet.expiresAt
                          ? wallet.expiresAt.toLocaleDateString("es-CO")
                          : "sin fecha"}
                      </p>
                      {Number(customer.pendingDebt || customer.debt_balance || 0) > 0 ? (
                        <p className="mt-2 text-xs font-semibold text-rose-700">
                          Deuda ticketera/cliente: {formatCOP(customer.pendingDebt || customer.debt_balance || 0)}
                        </p>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-[#fff7df] px-3 py-1 text-xs font-semibold text-[#946200] ring-1 ring-[#d4a72c]/20">
                      {wallet.balance} tickets
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <h3 className="text-lg font-semibold text-slate-900">Historial global del mes</h3>
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
              {[...ticketPurchases, ...ticketRedemptions]
                .sort((a, b) => {
                  const aTime = a.closed_at?.toDate?.()?.getTime?.() || 0;
                  const bTime = b.closed_at?.toDate?.()?.getTime?.() || 0;
                  return bTime - aTime;
                })
                .map((sale) => (
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
      </section>

      <ModalWrapper
        open={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        maxWidthClass="max-w-3xl"
        icon={{ main: <Ticket size={20} />, close: <X size={18} /> }}
        title={editingPlanId ? "Editar plan de tiquetera" : "Nuevo plan de tiquetera"}
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
              disabled={isSaving}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white"
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
        title="Asignar saldo inicial"
        description="Usa esta herramienta para migrar clientes antiguos o corregir el saldo de una tiquetera."
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
              label="Saldo inicial"
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
              disabled={isSaving}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white"
            >
              {isSaving ? "Asignando..." : "Guardar ajuste"}
            </button>
          </div>
        </form>
      </ModalWrapper>
    </section>
  );
}
