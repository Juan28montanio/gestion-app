import { useMemo, useState } from "react";
import { Building2, Pencil, Plus, Settings2, Trash2, X } from "lucide-react";
import {
  createSupplier,
  deleteSupplier,
  updateSupplier,
} from "../services/supplierService";
import ConfirmModal from "./ConfirmModal";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import ModalWrapper from "./ModalWrapper";
import { formatCOP } from "../utils/formatters";

const PAYMENT_TERMS = [
  { value: "Contado", label: "Contado" },
  { value: "Credito", label: "Credito" },
];

const EMPTY_SUPPLIER_FORM = {
  name: "",
  nit: "",
  category: "",
  contactName: "",
  phone: "",
  mobile: "",
  email: "",
  address: "",
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
    contactName: supplier.contact_name || supplier.contact || "",
    phone: supplier.phone || "",
    mobile: supplier.mobile || "",
    email: supplier.email || "",
    address: supplier.address || "",
    paymentTerms: supplier.payment_terms || supplier.paymentTerms || "Contado",
  };
}

export default function SupplierManager({
  businessId,
  suppliers,
  purchases,
  categoryOptions,
  onManageCategories,
}) {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_SUPPLIER_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const safeCategoryOptions = Array.isArray(categoryOptions) ? categoryOptions : [];

  const supplierSpend = useMemo(() => {
    return safePurchases.reduce((acc, purchase) => {
      const supplierId = purchase.supplier_id;
      acc[supplierId] = (acc[supplierId] || 0) + Number(purchase.total || 0);
      return acc;
    }, {});
  }, [safePurchases]);

  const filteredSuppliers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return safeSuppliers;
    }

    return safeSuppliers.filter((supplier) =>
      [
        supplier.name,
        supplier.nit,
        supplier.category,
        supplier.contact_name,
        supplier.contact,
        supplier.phone,
        supplier.mobile,
        supplier.email,
        supplier.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [safeSuppliers, search]);

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
      const payload = {
        ...form,
        contactName: form.contactName,
      };

      if (editingId) {
        await updateSupplier(editingId, businessId, payload);
      } else {
        await createSupplier(businessId, payload);
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
            Registra a quien le compras y mantén datos de contacto útiles para operación y cartera.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar proveedor..."
            className="rounded-2xl bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-slate-200"
          />
          <button
            type="button"
            onClick={onManageCategories}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Settings2 size={16} />
            Categorias
          </button>
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
          <thead className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="py-3 pr-4">Proveedor</th>
              <th className="py-3 pr-4">Categoria</th>
              <th className="py-3 pr-4">Contacto</th>
              <th className="py-3 pr-4">Ubicacion</th>
              <th className="py-3 pr-4">Plazo</th>
              <th className="py-3 pr-4 text-right">Volumen historico</th>
              <th className="py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map((supplier) => (
              <tr
                key={supplier.id}
                className="group border-b border-slate-100 text-slate-700 transition hover:bg-white/80"
              >
                <td className="py-3 pr-4">
                  <div>
                    <p className="font-semibold text-slate-900">{supplier.name}</p>
                    <p className="text-xs text-slate-500">{supplier.nit || "Sin NIT"}</p>
                  </div>
                </td>
                <td className="py-3 pr-4">{supplier.category || "General"}</td>
                <td className="py-3 pr-4">
                  <div className="space-y-1">
                    <p>{supplier.contact_name || supplier.contact || "Sin responsable"}</p>
                    <p className="text-xs text-slate-500">
                      {[supplier.mobile, supplier.phone].filter(Boolean).join(" / ") || "Sin telefonos"}
                    </p>
                    <p className="text-xs text-slate-500">{supplier.email || "Sin correo"}</p>
                  </div>
                </td>
                <td className="py-3 pr-4 text-sm text-slate-500">
                  {supplier.address || "Sin direccion"}
                </td>
                <td className="py-3 pr-4">{supplier.payment_terms || "Contado"}</td>
                <td className="py-3 pr-4 text-right font-mono font-semibold text-slate-900">
                  {formatCOP(Number(supplierSpend[supplier.id] || supplier.total_purchases_value || 0))}
                </td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
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

      <ModalWrapper
        open={isModalOpen}
        onClose={closeModal}
        maxWidthClass="max-w-4xl"
        icon={{ main: <Building2 size={20} />, close: <X size={18} /> }}
        title={editingId ? "Editar proveedor" : "Nuevo proveedor"}
        description="Organiza el directorio de proveedores con categorias y datos de contacto completos."
      >
        <form onSubmit={handleSubmit} className="grid gap-6">
          <section className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Datos basicos
              </h4>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Nombre o razon social"
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
              <FormInput
                label="NIT"
                value={form.nit}
                onChange={(event) =>
                  setForm((current) => ({ ...current, nit: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <FormSelect
                label="Categoria"
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
                options={safeCategoryOptions}
              />
              <div className="grid content-end">
                <button
                  type="button"
                  onClick={onManageCategories}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Gestionar categorias
                </button>
              </div>
            </div>

            <FormSelect
              label="Plazo de pago"
              value={form.paymentTerms}
              onChange={(event) =>
                setForm((current) => ({ ...current, paymentTerms: event.target.value }))
              }
              options={PAYMENT_TERMS}
            />
          </section>

          <section className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Datos de contacto
              </h4>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Contacto principal"
                value={form.contactName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, contactName: event.target.value }))
                }
              />
              <FormInput
                label="Celular"
                value={form.mobile}
                onChange={(event) =>
                  setForm((current) => ({ ...current, mobile: event.target.value }))
                }
              />
              <FormInput
                label="Telefono fijo"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
              />
              <FormInput
                label="Correo"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
              />
              <FormInput
                className="md:col-span-2"
                label="Direccion"
                value={form.address}
                onChange={(event) =>
                  setForm((current) => ({ ...current, address: event.target.value }))
                }
              />
            </div>
          </section>

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
      </ModalWrapper>

      <ConfirmModal
        open={Boolean(supplierToDelete)}
        title="Eliminar proveedor"
        description={supplierToDelete ? `Se eliminara ${supplierToDelete.name} del directorio.` : ""}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setSupplierToDelete(null)}
      />
    </section>
  );
}
