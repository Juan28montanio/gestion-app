import { useMemo, useState } from "react";
import { Building2, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createSupplier,
  deleteSupplier,
  updateSupplier,
} from "../services/supplierService";
import ConfirmModal from "./ConfirmModal";
import { formatCOP } from "../utils/formatters";

const EMPTY_SUPPLIER_FORM = {
  name: "",
  nit: "",
  category: "",
  contact: "",
  phone: "",
  paymentTerms: "Contado",
};

function buildSupplierForm(supplier) {
  if (!supplier) {
    return EMPTY_SUPPLIER_FORM;
  }

  return {
    name: supplier.name || "",
    nit: supplier.nit || "",
    category: supplier.category || "",
    contact: supplier.contact || "",
    phone: supplier.phone || "",
    paymentTerms: supplier.payment_terms || supplier.paymentTerms || "Contado",
  };
}

export default function SupplierManager({ businessId, suppliers, purchases }) {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_SUPPLIER_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  const supplierSpend = useMemo(() => {
    return purchases.reduce((acc, purchase) => {
      const supplierId = purchase.supplier_id;
      acc[supplierId] = (acc[supplierId] || 0) + Number(purchase.total || 0);
      return acc;
    }, {});
  }, [purchases]);

  const filteredSuppliers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return suppliers;
    }

    return suppliers.filter((supplier) =>
      [supplier.name, supplier.nit, supplier.category, supplier.contact]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [search, suppliers]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_SUPPLIER_FORM);
    setFeedback({ type: "", message: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      if (editingId) {
        await updateSupplier(editingId, businessId, form);
      } else {
        await createSupplier(businessId, form);
      }

      closeModal();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "No fue posible guardar el proveedor.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) {
      return;
    }

    try {
      await deleteSupplier(supplierToDelete.id);
    } finally {
      setSupplierToDelete(null);
    }
  };

  return (
    <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Proveedores</h2>
          <p className="text-sm text-slate-500">
            Registra a quien le compras y sigue el volumen historico por aliado.
          </p>
        </div>

        <div className="flex gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar proveedor..."
            className="rounded-2xl bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-slate-200"
          />
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(EMPTY_SUPPLIER_FORM);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20"
          >
            <Plus size={16} />
            Nuevo
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[28px] bg-slate-50 p-4 ring-1 ring-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-3 pr-4">Proveedor</th>
              <th className="py-3 pr-4">Categoria</th>
              <th className="py-3 pr-4">Contacto</th>
              <th className="py-3 pr-4">Terminos</th>
              <th className="py-3 pr-4">Volumen historico</th>
              <th className="py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id} className="border-b border-slate-100 text-slate-700">
                <td className="py-3 pr-4">
                  <div>
                    <p className="font-semibold text-slate-900">{supplier.name}</p>
                    <p className="text-xs text-slate-500">{supplier.nit || "Sin NIT"}</p>
                  </div>
                </td>
                <td className="py-3 pr-4">{supplier.category || "General"}</td>
                <td className="py-3 pr-4">
                  <div>
                    <p>{supplier.contact || "Sin contacto"}</p>
                    <p className="text-xs text-slate-500">{supplier.phone || "Sin telefono"}</p>
                  </div>
                </td>
                <td className="py-3 pr-4">{supplier.payment_terms || "Contado"}</td>
                <td className="py-3 pr-4 font-semibold text-slate-900">
                  {formatCOP(
                    Number(supplier.total_purchases_value || supplierSpend[supplier.id] || 0)
                  )}
                </td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(supplier.id);
                        setForm(buildSupplierForm(supplier));
                        setIsModalOpen(true);
                      }}
                      className="rounded-2xl bg-slate-100 p-2.5 text-slate-700 transition hover:bg-slate-200"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSupplierToDelete(supplier)}
                      className="rounded-2xl bg-rose-50 p-2.5 text-rose-700 transition hover:bg-rose-100"
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

      {isModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Building2 size={20} />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">
                  {editingId ? "Editar proveedor" : "Nuevo proveedor"}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-700">
                  Nombre / Razon social
                  <input
                    required
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-700">
                  NIT
                  <input
                    value={form.nit}
                    onChange={(event) => setForm((current) => ({ ...current, nit: event.target.value }))}
                    className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="grid gap-2 text-sm text-slate-700">
                  Categoria
                  <input
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-700">
                  Contacto
                  <input
                    value={form.contact}
                    onChange={(event) => setForm((current) => ({ ...current, contact: event.target.value }))}
                    className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-700">
                  Telefono
                  <input
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm text-slate-700">
                Terminos de pago
                <select
                  value={form.paymentTerms}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, paymentTerms: event.target.value }))
                  }
                  className="rounded-2xl bg-slate-50 px-4 py-3 outline-none ring-1 ring-slate-200"
                >
                  <option value="Contado">Contado</option>
                  <option value="Credito">Credito</option>
                </select>
              </label>

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
                  {isSaving ? "Guardando..." : editingId ? "Actualizar" : "Crear proveedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(supplierToDelete)}
        title="Eliminar proveedor"
        description={
          supplierToDelete
            ? `Se eliminara ${supplierToDelete.name} del directorio.`
            : ""
        }
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setSupplierToDelete(null)}
      />
    </section>
  );
}
