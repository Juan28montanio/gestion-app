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

function normalizeComparableValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function createEmptySupplierForm() {
  return {
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
}

function buildSupplierForm(supplier) {
  if (!supplier) {
    return createEmptySupplierForm();
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
  const [form, setForm] = useState(createEmptySupplierForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const safeCategoryOptions = Array.isArray(categoryOptions) ? categoryOptions : [];
  const supplierSummary = useMemo(() => {
    const supplierIdsWithPurchases = new Set(
      safePurchases.map((purchase) => purchase.supplier_id).filter(Boolean)
    );

    return {
      total: safeSuppliers.length,
      withRecentFlow: safeSuppliers.filter((supplier) => supplierIdsWithPurchases.has(supplier.id)).length,
      creditTerms: safeSuppliers.filter(
        (supplier) =>
          String(supplier.payment_terms || supplier.paymentTerms || "Contado").toLowerCase() === "credito"
      ).length,
      withoutContact: safeSuppliers.filter(
        (supplier) => !String(supplier.mobile || supplier.phone || supplier.email || "").trim()
      ).length,
    };
  }, [safePurchases, safeSuppliers]);

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

  const supplierDuplicates = useMemo(() => {
    const currentName = normalizeComparableValue(form.name);
    const currentNit = normalizeComparableValue(form.nit);
    const currentMobile = normalizeComparableValue(form.mobile);
    const currentEmail = normalizeComparableValue(form.email);
    const currentContact = normalizeComparableValue(form.contactName);

    if (!currentName) {
      return {
        exactMatch: null,
        nameMatches: [],
      };
    }

    const candidates = safeSuppliers.filter((supplier) => supplier.id !== editingId);
    const nameMatches = candidates.filter(
      (supplier) => normalizeComparableValue(supplier.name) === currentName
    );

    const exactMatch =
      candidates.find((supplier) => {
        const supplierNit = normalizeComparableValue(supplier.nit);
        const supplierMobile = normalizeComparableValue(supplier.mobile);
        const supplierEmail = normalizeComparableValue(supplier.email);
        const supplierContact = normalizeComparableValue(
          supplier.contact_name || supplier.contact
        );

        return (
          normalizeComparableValue(supplier.name) === currentName &&
          ((currentNit && supplierNit === currentNit) ||
            (currentMobile && supplierMobile === currentMobile) ||
            (currentEmail && supplierEmail === currentEmail) ||
            (currentContact && supplierContact === currentContact))
        );
      }) || null;

    return {
      exactMatch,
      nameMatches,
    };
  }, [editingId, form.contactName, form.email, form.mobile, form.name, form.nit, safeSuppliers]);

  const isSupplierSubmitBlocked =
    isSaving ||
    !String(form.name || "").trim() ||
    Boolean(supplierDuplicates.exactMatch);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(createEmptySupplierForm());
    setFeedback({ type: "", message: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedName = String(form.name || "").trim();

    if (!normalizedName) {
      setFeedback({
        type: "error",
        message: "El proveedor debe tener nombre o razon social para poder guardarse.",
      });
      return;
    }

    if (supplierDuplicates.exactMatch) {
      setFeedback({
        type: "error",
        message: `Ya existe un proveedor muy similar: ${supplierDuplicates.exactMatch.name}. Revisa NIT, contacto o actualiza el registro existente.`,
      });
      return;
    }

    setIsSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      const payload = {
        ...form,
        name: normalizedName,
        nit: String(form.nit || "").trim(),
        category: String(form.category || "").trim(),
        contactName: String(form.contactName || "").trim(),
        phone: String(form.phone || "").trim(),
        mobile: String(form.mobile || "").trim(),
        email: String(form.email || "").trim(),
        address: String(form.address || "").trim(),
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
            Manten un directorio claro para comprar mejor, negociar plazos y no perder seguimiento.
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
            onClick={() => onManageCategories?.()}
            disabled={!onManageCategories}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Settings2 size={16} />
            Categorias
          </button>
          <button
            type="button"
              onClick={() => {
                setEditingId(null);
                setForm(createEmptySupplierForm());
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
        description="Registra solo los datos que realmente ayudan a comprar, contactar y controlar plazos sin friccion."
      >
        <form onSubmit={handleSubmit} className="grid gap-6">
          <section className="grid gap-3 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Flujo recomendado
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">1. Identifica al proveedor</p>
                <p className="mt-1 text-sm text-slate-500">Nombre, categoria y plazo de pago.</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">2. Define el canal util</p>
                <p className="mt-1 text-sm text-slate-500">Celular, correo o ambos para resolver rapido.</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">3. Guarda lo minimo valioso</p>
                <p className="mt-1 text-sm text-slate-500">Evita llenar campos que luego nadie consulta.</p>
              </div>
            </div>
          </section>
          <section className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Datos basicos
              </h4>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Nombre o razon social"
                labelNote="Clave"
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
              <FormInput
                label="NIT"
                labelNote="Opcional"
                value={form.nit}
                onChange={(event) =>
                  setForm((current) => ({ ...current, nit: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <FormSelect
                label="Categoria"
                labelNote="Clasifica"
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
                options={safeCategoryOptions}
              />
              <div className="grid content-end">
                <button
                  type="button"
                  onClick={() => onManageCategories?.()}
                  disabled={!onManageCategories}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Gestionar categorias
                </button>
              </div>
            </div>

            <FormSelect
              label="Plazo de pago"
              labelNote="Caja"
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
                labelNote="Operacion"
                value={form.contactName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, contactName: event.target.value }))
                }
              />
              <FormInput
                label="Celular"
                labelNote="Rapido"
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
                labelNote="Soporte"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
              />
              <FormInput
                className="md:col-span-2"
                label="Direccion"
                labelNote="Logistica"
                value={form.address}
                onChange={(event) =>
                  setForm((current) => ({ ...current, address: event.target.value }))
                }
              />
            </div>
          </section>

          {supplierDuplicates.nameMatches.length > 0 && !supplierDuplicates.exactMatch ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
              Ya existe {supplierDuplicates.nameMatches.length === 1 ? "un proveedor con este nombre" : `${supplierDuplicates.nameMatches.length} proveedores con este nombre`}. Si es otro registro distinto, agrega NIT, contacto o celular para diferenciarlo mejor en compras.
            </div>
          ) : null}

          {supplierDuplicates.exactMatch ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
              Este proveedor parece duplicado del registro existente <span className="font-semibold">{supplierDuplicates.exactMatch.name}</span>. Usa el proveedor actual o cambia los datos identificadores antes de guardar.
            </div>
          ) : null}

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
              disabled={isSupplierSubmitBlocked}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
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

