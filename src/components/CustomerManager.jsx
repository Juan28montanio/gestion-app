import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import {
  createCustomer,
  deleteCustomer,
  subscribeToCustomers,
  updateCustomer,
} from "../services/customerService";
import { subscribeToSalesHistory } from "../services/financeService";
import ConfirmModal from "./ConfirmModal";
import FormInput from "./FormInput";
import ModalWrapper from "./ModalWrapper";
import { formatCOP } from "../utils/formatters";

const EMPTY_CUSTOMER_FORM = {
  name: "",
  phone: "",
  email: "",
  notes: "",
};

function buildCustomerForm(customer) {
  if (!customer) {
    return EMPTY_CUSTOMER_FORM;
  }

  return {
    name: customer.name || "",
    phone: customer.phone || "",
    email: customer.email || "",
    notes: customer.notes || "",
  };
}

export default function CustomerManager({ businessId }) {
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_CUSTOMER_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

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
        customerSales.reduce((acc, sale) => {
          (sale.items || []).forEach((item) => {
            acc[item.name] = (acc[item.name] || 0) + Number(item.quantity || 0);
          });
          return acc;
        }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      return {
        ...customer,
        orderCount: customerSales.length,
        debtBalance: Number(customer.debt_balance || 0),
        frequentProducts,
        history: customerSales.slice(0, 5),
      };
    });
  }, [customers, sales]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return customerInsights;
    }

    return customerInsights.filter((customer) =>
      [customer.name, customer.phone, customer.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [customerInsights, search]);

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
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Clientes</h2>
            <p className="text-sm text-slate-500">
              Gestiona clientes frecuentes, deuda pendiente e historial de compra.
            </p>
          </div>

          <div className="flex gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente..."
              className="rounded-2xl bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-slate-200"
            />
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_CUSTOMER_FORM);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20"
            >
              <Plus size={16} />
              Nuevo cliente
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {filteredCustomers.map((customer) => (
            <article
              key={customer.id}
              className="rounded-[28px] bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{customer.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {customer.phone || "Sin telefono"} {customer.email ? `· ${customer.email}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                  Deuda {formatCOP(customer.debtBalance)}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pedidos</p>
                  <p className="mt-2 font-semibold text-slate-900">{customer.orderCount}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 sm:col-span-2">
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
                      <div key={sale.id} className="flex items-center justify-between gap-3 text-sm">
                        <div>
                          <p className="font-medium text-slate-800">
                            {sale.table_name || sale.table_id || "Mesa"}
                          </p>
                          <p className="text-xs text-slate-500">
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
      </section>

      <ModalWrapper
        open={isModalOpen}
        onClose={closeModal}
        maxWidthClass="max-w-3xl"
        icon={{ main: <UserRound size={20} />, close: <X size={18} /> }}
        title={editingId ? "Editar cliente" : "Nuevo cliente"}
        description="Registra clientes frecuentes y usalos en el POS para ventas con historial y deudas."
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
