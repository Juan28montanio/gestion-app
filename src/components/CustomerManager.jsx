import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, List, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import {
  createCustomer,
  deleteCustomer,
  getTicketWalletState,
  subscribeToCustomers,
  updateCustomer,
} from "../services/customerService";
import { subscribeToSalesHistory } from "../services/financeService";
import ConfirmModal from "./ConfirmModal";
import FormInput from "./FormInput";
import ModalWrapper from "./ModalWrapper";
import { formatCOP } from "../utils/formatters";
import { useDecisionCenter } from "../app/decision-center/DecisionCenterContext";

const EMPTY_CUSTOMER_FORM = {
  name: "",
  phone: "",
  email: "",
  notes: "",
  ticketBalanceUnits: 0,
  ticketTotalPurchased: 0,
  ticketLastUsedAt: null,
  ticketExpiresAt: null,
};

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "debt", label: "Con deuda" },
  { id: "ticket", label: "Con ticketera" },
  { id: "inactive", label: "Sin compra reciente" },
  { id: "top", label: "Top clientes" },
];

function getCustomerSegment(customer) {
  if (customer.orderCount >= 8 || customer.totalSpent >= 300000) {
    return {
      label: "Cliente clave",
      tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    };
  }

  if (customer.orderCount >= 3) {
    return {
      label: "Frecuente",
      tone: "bg-sky-50 text-sky-700 ring-sky-200",
    };
  }

  return {
    label: "Por activar",
    tone: "bg-slate-100 text-slate-700 ring-slate-200",
  };
}

function buildCustomerForm(customer) {
  if (!customer) {
    return EMPTY_CUSTOMER_FORM;
  }

  return {
    name: customer.name || "",
    phone: customer.phone || "",
    email: customer.email || "",
    notes: customer.notes || "",
    ticketBalanceUnits: Number(customer.ticket_balance_units || 0),
    ticketTotalPurchased: Number(customer.ticket_total_purchased || 0),
    ticketLastUsedAt: customer.ticket_last_used_at || null,
    ticketExpiresAt: customer.ticket_expires_at || null,
  };
}

export default function CustomerManager({ businessId }) {
  const { publishSectionInsights, clearSectionInsights, openDecisionCenter } = useDecisionCenter();
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [viewMode, setViewMode] = useState("cards");
  const [form, setForm] = useState(EMPTY_CUSTOMER_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isCompactLayout, setIsCompactLayout] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsCompactLayout(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isCompactLayout && viewMode === "table") {
      setViewMode("cards");
    }
  }, [isCompactLayout, viewMode]);

  useEffect(() => {
    const unsubscribeCustomers = subscribeToCustomers(businessId, setCustomers);
    const unsubscribeSales = subscribeToSalesHistory(businessId, setSales);
    return () => {
      unsubscribeCustomers();
      unsubscribeSales();
    };
  }, [businessId]);

  const customerInsights = useMemo(() => {
    return customers.map((customer) => {
      const customerSales = sales.filter((sale) => sale.customer_id === customer.id);
      const frequentProducts = Object.entries(
        customerSales.reduce((accumulator, sale) => {
          (sale.items || []).forEach((item) => {
            accumulator[item.name] = (accumulator[item.name] || 0) + Number(item.quantity || 0);
          });
          return accumulator;
        }, {})
      )
        .sort((left, right) => right[1] - left[1])
        .slice(0, 3);
      const latestSale = customerSales[0] || null;
      const lastPurchaseDate = latestSale?.closed_at?.toDate
        ? latestSale.closed_at.toDate()
        : latestSale?.createdAt?.toDate?.() || null;
      const now = Date.now();
      const daysWithoutPurchase = lastPurchaseDate
        ? Math.floor((now - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...customer,
        orderCount: customerSales.length,
        totalSpent: customerSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
        debtBalance: Number(customer.debt_balance || 0),
        ticketWallet: getTicketWalletState(customer),
        frequentProducts,
        history: customerSales.slice(0, 5),
        lastPurchaseDate,
        daysWithoutPurchase,
      };
    }).map((customer) => ({
      ...customer,
      segment: getCustomerSegment(customer),
    }));
  }, [customers, sales]);

  const customerSummary = useMemo(() => {
    return {
      debtors: customerInsights.filter((customer) => customer.debtBalance > 0).length,
      activeWallets: customerInsights.filter((customer) => customer.ticketWallet.balance > 0).length,
      inactive: customerInsights.filter(
        (customer) => customer.daysWithoutPurchase === null || customer.daysWithoutPurchase > 30
      ).length,
      topCount: customerInsights.filter((customer) => customer.orderCount >= 5).length,
    };
  }, [customerInsights]);

  const customerDecisionItems = useMemo(() => {
    const debtors = customerInsights.filter((customer) => customer.debtBalance > 0);
    const walletsLowBalance = customerInsights.filter(
      (customer) => customer.ticketWallet.balance > 0 && customer.ticketWallet.lowBalance
    );
    const inactiveCustomers = customerInsights.filter(
      (customer) => customer.daysWithoutPurchase === null || customer.daysWithoutPurchase > 30
    );
    const topCustomer = [...customerInsights].sort((left, right) => right.totalSpent - left.totalSpent)[0];

    return [
      {
        title: "Cobros pendientes por priorizar",
        body: debtors.length
          ? `${debtors.length} cliente(s) mantienen deuda activa. Conviene recuperar ese saldo antes de seguir ampliando credito.`
          : "No hay deuda pendiente en clientes. La base actual esta mas lista para fidelizacion que para recuperacion.",
        tone: debtors.length
          ? "bg-rose-50 text-rose-900 ring-rose-200"
          : "bg-emerald-50 text-emerald-900 ring-emerald-200",
        icon: "lightbulb",
      },
      {
        title: "Renovacion de ticketeras",
        body: walletsLowBalance.length
          ? `${walletsLowBalance.length} cliente(s) ya tienen saldo bajo en ticketera. Hay oportunidad directa de recompra sin esperar que se agoten.`
          : "No hay clientes con ticketera en saldo bajo por ahora. El frente prepago esta estable.",
        tone: "bg-[#fff7df] text-[#7a5500] ring-[#d4a72c]/25",
        icon: "sparkles",
      },
      {
        title: "Base por reactivar",
        body: inactiveCustomers.length
          ? `${inactiveCustomers.length} cliente(s) no compran hace tiempo o aun no registran pedidos. Este grupo merece seguimiento comercial ligero.`
          : "La base actual no muestra clientes claramente inactivos en este momento.",
        tone: "bg-slate-50 text-slate-900 ring-slate-200",
        icon: "lightbulb",
      },
      {
        title: "Cliente de mayor valor",
        body: topCustomer
          ? `${topCustomer.name} lidera la base con ${topCustomer.orderCount} pedido(s) y ${formatCOP(topCustomer.totalSpent)} acumulados. Conviene cuidarlo como referente de recurrencia.`
          : "Aun no hay suficiente historial para detectar un cliente lider.",
        tone: "bg-white text-slate-900 ring-slate-200",
        icon: "sparkles",
      },
    ];
  }, [customerInsights]);

  const customerDecisionSummary = useMemo(() => {
    if (customerSummary.debtors > 0) {
      return `${customerSummary.debtors} cliente(s) con deuda y ${customerSummary.inactive} por reactivar ya requieren seguimiento comercial ordenado.`;
    }

    if (customerSummary.activeWallets > 0) {
      return `${customerSummary.activeWallets} cliente(s) mantienen ticketera activa y la vista principal queda enfocada en operar sin saturarse de recomendaciones.`;
    }

    return "El modulo queda enfocado en historial, segmentacion y acciones comerciales visibles desde un solo panel secundario.";
  }, [customerSummary.activeWallets, customerSummary.debtors, customerSummary.inactive]);

  useEffect(() => {
    publishSectionInsights("clients", {
      eyebrow: "Clientes",
      title: "Seguimiento comercial y recompra",
      summary: customerDecisionSummary,
      items: customerDecisionItems,
    });

    return () => clearSectionInsights("clients");
  }, [
    clearSectionInsights,
    customerDecisionItems,
    customerDecisionSummary,
    publishSectionInsights,
  ]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return customerInsights
      .filter((customer) =>
        [customer.name, customer.phone, customer.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term)
      )
      .filter((customer) => {
        if (activeFilter === "debt") {
          return customer.debtBalance > 0;
        }

        if (activeFilter === "ticket") {
          return customer.ticketWallet.balance > 0;
        }

        if (activeFilter === "inactive") {
          return customer.daysWithoutPurchase === null || customer.daysWithoutPurchase > 30;
        }

        if (activeFilter === "top") {
          return customer.orderCount >= 5;
        }

        return true;
      })
      .sort((left, right) => right.orderCount - left.orderCount);
  }, [activeFilter, customerInsights, search]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_CUSTOMER_FORM);
    setFeedback({ type: "", message: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      if (editingId) {
        await updateCustomer(editingId, businessId, form);
      } else {
        await createCustomer(businessId, form);
      }
      closeModal();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible guardar el cliente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!customerToDelete) {
      return;
    }

    try {
      await deleteCustomer(customerToDelete.id);
    } finally {
      setCustomerToDelete(null);
    }
  };

  return (
    <section className="space-y-6">
      <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Clientes</h2>
            <p className="text-sm text-slate-500">
              Gestiona clientes frecuentes, ticketeras activas y deuda pendiente con lectura rapida.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] xl:min-w-[620px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente..."
              className="min-w-0 rounded-2xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-slate-200"
            />
            <div
              className={`inline-flex rounded-2xl bg-slate-100 p-1 ring-1 ring-slate-200 ${
                isCompactLayout ? "hidden" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${viewMode === "cards" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${viewMode === "table" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                <List size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_CUSTOMER_FORM);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20"
            >
              <Plus size={16} />
              Nuevo cliente
            </button>
          </div>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Cobro por recuperar</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{customerSummary.debtors}</p>
          </article>
          <article className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Clientes con saldo</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{customerSummary.activeWallets}</p>
          </article>
          <article className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Clientes por reactivar</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{customerSummary.inactive}</p>
          </article>
          <article className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Clientes fidelizados</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{customerSummary.topCount}</p>
          </article>
        </div>

        <div className="mb-5 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Centro de decisiones
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{customerDecisionSummary}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold ${
                  customerDecisionItems.length > 0
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {customerDecisionItems.length} lectura{customerDecisionItems.length === 1 ? "" : "s"} activa{customerDecisionItems.length === 1 ? "" : "s"}
              </div>
              <button
                type="button"
                onClick={openDecisionCenter}
                disabled={customerDecisionItems.length === 0}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  customerDecisionItems.length > 0
                    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                Ver panel
              </button>
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                activeFilter === filter.id
                  ? "bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {viewMode === "cards" ? (
          <div className="grid gap-4 2xl:grid-cols-2">
            {filteredCustomers.map((customer) => (
              <article
                key={customer.id}
                className="rounded-[28px] bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900">{customer.name}</h3>
                    <p className="mt-1 break-words text-sm text-slate-500">
                      {customer.phone || "Sin telefono"} {customer.email ? `· ${customer.email}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:max-w-[280px] md:justify-end">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${customer.segment.tone}`}>
                      {customer.segment.label}
                    </span>
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                      Deuda {formatCOP(customer.debtBalance)}
                    </span>
                    <span className="rounded-full bg-[#fff7df] px-3 py-1 text-xs font-semibold text-[#946200] ring-1 ring-[#d4a72c]/20">
                      Tiquetera {customer.ticketWallet.balance}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                  <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pedidos</p>
                    <p className="mt-2 font-semibold text-slate-900">{customer.orderCount}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Valor acumulado</p>
                    <p className="mt-2 font-semibold text-slate-900">{formatCOP(customer.totalSpent)}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Saldo ticket</p>
                    <p className="mt-2 font-semibold text-slate-900">{customer.ticketWallet.balance}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Ultima compra</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {customer.daysWithoutPurchase === null
                        ? "Sin compras"
                        : `Hace ${customer.daysWithoutPurchase} dia${customer.daysWithoutPurchase === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 sm:col-span-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Frecuentes</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {customer.frequentProducts.length
                        ? customer.frequentProducts.map(([name]) => name).join(", ")
                        : "Sin historial suficiente"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Historial reciente
                  </p>
                  <div className="mt-3 space-y-2">
                    {customer.history.length ? (
                      customer.history.map((sale) => (
                        <div key={sale.id} className="flex flex-col gap-2 border-b border-slate-100 pb-2 text-sm last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800">
                              {sale.table_name || sale.table_id || "Mesa"}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {(sale.items || []).map((item) => `${item.quantity}x ${item.name}`).join(", ")}
                            </p>
                          </div>
                          <span className="font-semibold text-slate-900">{formatCOP(sale.total || 0)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Sin pedidos registrados.</p>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(customer.id);
                      setForm(buildCustomerForm(customer));
                      setIsModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    <Pencil size={16} />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerToDelete(customer)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                  >
                    <Trash2 size={16} />
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[28px] bg-slate-50 p-4 ring-1 ring-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="py-3 pr-4">Cliente</th>
                  <th className="py-3 pr-4">Contacto</th>
                  <th className="py-3 pr-4">Segmento</th>
                  <th className="py-3 pr-4">Pedidos</th>
                  <th className="py-3 pr-4">Ticketera</th>
                  <th className="py-3 pr-4">Deuda</th>
                  <th className="py-3 pr-4">Ultima compra</th>
                  <th className="py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3 pr-4 font-semibold text-slate-900">{customer.name}</td>
                    <td className="py-3 pr-4">
                      {[customer.phone, customer.email].filter(Boolean).join(" · ") || "Sin contacto"}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${customer.segment.tone}`}>
                        {customer.segment.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{customer.orderCount}</td>
                    <td className="py-3 pr-4">{customer.ticketWallet.balance}</td>
                    <td className="py-3 pr-4">{formatCOP(customer.debtBalance)}</td>
                    <td className="py-3 pr-4">
                      {customer.lastPurchaseDate
                        ? customer.lastPurchaseDate.toLocaleDateString("es-CO")
                        : "Sin compras"}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(customer.id);
                            setForm(buildCustomerForm(customer));
                            setIsModalOpen(true);
                          }}
                          className="rounded-2xl bg-slate-100 p-2.5 text-slate-700"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerToDelete(customer)}
                          className="rounded-2xl bg-rose-50 p-2.5 text-rose-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ModalWrapper
        open={isModalOpen}
        onClose={closeModal}
        maxWidthClass="max-w-3xl"
        icon={{ main: <UserRound size={20} />, close: <X size={18} /> }}
        title={editingId ? "Editar cliente" : "Nuevo cliente"}
        description="Registra clientes frecuentes y usalos en el POS para ventas con historial y deuda controlada."
      >
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Nombre"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <FormInput
              label="Telefono"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Correo"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
            <FormInput
              label="Notas"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </div>

          {feedback.message ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
              {feedback.message}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white"
            >
              {isSaving ? "Guardando..." : editingId ? "Actualizar cliente" : "Crear cliente"}
            </button>
          </div>
        </form>
      </ModalWrapper>

      <ConfirmModal
        open={Boolean(customerToDelete)}
        title="Eliminar cliente"
        description={
          customerToDelete ? `Se eliminara ${customerToDelete.name} del directorio.` : ""
        }
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setCustomerToDelete(null)}
      />
    </section>
  );
}
