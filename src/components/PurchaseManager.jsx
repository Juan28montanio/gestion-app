import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileClock,
  PackageCheck,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings2,
  X,
} from "lucide-react";
import {
  cancelPurchase,
  confirmPurchase,
  createPurchase,
  PURCHASE_STATUS,
  registerPurchaseReturn,
  subscribeToInventoryMovements,
  updatePurchase,
} from "../services/purchaseService";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import ModalWrapper from "./ModalWrapper";
import { formatCOP } from "../utils/formatters";
import { SUPPLY_UNITS } from "../utils/resourceOptions";

const STATUS_META = {
  [PURCHASE_STATUS.DRAFT]: {
    label: "Borrador",
    classes: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  [PURCHASE_STATUS.CONFIRMED]: {
    label: "Confirmada",
    classes: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  },
  [PURCHASE_STATUS.CANCELED]: {
    label: "Anulada",
    classes: "bg-rose-100 text-rose-700 ring-rose-200",
  },
  [PURCHASE_STATUS.PARTIAL]: {
    label: "Parcial",
    classes: "bg-amber-100 text-amber-700 ring-amber-200",
  },
  [PURCHASE_STATUS.RETURNED]: {
    label: "Devuelta",
    classes: "bg-sky-100 text-sky-700 ring-sky-200",
  },
};

function createEmptyHeader() {
  return {
    supplierId: "",
    purchaseNumber: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    notes: "",
  };
}

function createEmptyItem() {
  return {
    inventoryItemId: "",
    manualName: "",
    category: "",
    quantity: "",
    unit: "g",
    unitCost: "",
    applyIva: false,
    ivaPct: "19",
    batch: "",
    expirationDate: "",
    notes: "",
  };
}

function buildSupplyMap(supplies) {
  return new Map(supplies.map((supply) => [supply.id, supply]));
}

function normalizeText(value) {
  return String(value || "").trim();
}

function getPurchaseNumber(purchase) {
  return purchase.purchaseNumber || purchase.purchase_number || purchase.invoice_number || purchase.id;
}

function getPurchaseSupplierId(purchase) {
  return purchase.supplierId || purchase.supplier_id || purchase.supplier?.supplierId || "";
}

function getPurchaseSupplierName(purchase) {
  return purchase.supplierName || purchase.supplier_name || purchase.supplier?.supplierName || "Proveedor";
}

function getPurchaseDate(purchase) {
  return purchase.purchaseDate || purchase.purchase_date || "";
}

function getPurchaseStatus(purchase) {
  return purchase.status || PURCHASE_STATUS.DRAFT;
}

function getPurchaseUser(purchase) {
  return (
    purchase.audit?.createdBy ||
    purchase.userId ||
    purchase.user_id ||
    purchase.created_by ||
    "Sistema"
  );
}

function calculateItemSubtotal(item) {
  const quantity = Number(item.quantity || 0);
  const unitCost = Number(item.unitCost || 0);
  return quantity * unitCost;
}

function calculateItemTaxes(item) {
  if (!item.applyIva) {
    return 0;
  }
  return calculateItemSubtotal(item) * (Number(item.ivaPct || 0) / 100);
}

function calculateFormTotals(items) {
  return items.reduce(
    (totals, item) => {
      const subtotal = calculateItemSubtotal(item);
      const taxes = calculateItemTaxes(item);
      return {
        subtotal: totals.subtotal + subtotal,
        taxes: totals.taxes + taxes,
        total: totals.total + subtotal + taxes,
      };
    },
    { subtotal: 0, taxes: 0, total: 0 }
  );
}

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }
  return String(value).slice(0, 10);
}

function getTimestampLabel(value) {
  if (!value) {
    return "Pendiente";
  }
  if (typeof value === "string") {
    return value.slice(0, 16).replace("T", " ");
  }
  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleString("es-CO");
  }
  return "Registrado";
}

function toFormFromPurchase(purchase) {
  return {
    header: {
      supplierId: getPurchaseSupplierId(purchase),
      purchaseNumber: getPurchaseNumber(purchase),
      purchaseDate: getPurchaseDate(purchase),
      notes: purchase.notes || "",
    },
    items: (purchase.items || []).map((item) => ({
      inventoryItemId: item.inventoryItemId || item.ingredient_id || "",
      manualName: item.inventoryItemName || item.ingredient_name || "",
      category: item.category || "",
      quantity: String(item.quantity || ""),
      unit: item.unit || "und",
      unitCost: String(item.unitCost ?? item.unit_cost ?? item.unit_price ?? ""),
      applyIva: Boolean(item.apply_iva),
      ivaPct: String(item.iva_pct || 19),
      batch: item.batch || "",
      expirationDate: item.expirationDate || item.expiration_date || "",
      notes: item.notes || "",
    })),
  };
}

function PurchaseStatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META[PURCHASE_STATUS.DRAFT];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${meta.classes}`}>
      {meta.label}
    </span>
  );
}

export default function PurchaseManager({
  businessId,
  suppliers,
  supplies,
  purchases,
  recipeBooks,
  categoryOptions,
  onManageCategories,
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [header, setHeader] = useState(createEmptyHeader);
  const [items, setItems] = useState(() => [createEmptyItem()]);
  const [filters, setFilters] = useState({
    status: "all",
    supplierId: "all",
    dateFrom: "",
    dateTo: "",
    search: "",
  });
  const [inventoryMovements, setInventoryMovements] = useState([]);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);

  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const safeSupplies = Array.isArray(supplies) ? supplies : [];
  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const safeRecipeBooks = Array.isArray(recipeBooks) ? recipeBooks : [];
  const safeCategoryOptions = Array.isArray(categoryOptions) ? categoryOptions : [];
  const supplyMap = useMemo(() => buildSupplyMap(safeSupplies), [safeSupplies]);
  const totals = useMemo(() => calculateFormTotals(items), [items]);

  useEffect(() => subscribeToInventoryMovements(businessId, setInventoryMovements), [businessId]);

  const selectedSupplier = safeSuppliers.find((supplier) => supplier.id === header.supplierId);

  const filteredPurchases = useMemo(() => {
    const search = normalizeText(filters.search).toLowerCase();
    return safePurchases.filter((purchase) => {
      const status = getPurchaseStatus(purchase);
      const supplierId = getPurchaseSupplierId(purchase);
      const date = getPurchaseDate(purchase);
      const text = `${getPurchaseNumber(purchase)} ${getPurchaseSupplierName(purchase)} ${purchase.notes || ""}`.toLowerCase();

      if (filters.status !== "all" && status !== filters.status) {
        return false;
      }
      if (filters.supplierId !== "all" && supplierId !== filters.supplierId) {
        return false;
      }
      if (filters.dateFrom && date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && date > filters.dateTo) {
        return false;
      }
      return !search || text.includes(search);
    });
  }, [filters, safePurchases]);

  const purchaseStats = useMemo(() => {
    const confirmed = safePurchases.filter(
      (purchase) => getPurchaseStatus(purchase) === PURCHASE_STATUS.CONFIRMED
    );
    const drafts = safePurchases.filter((purchase) => getPurchaseStatus(purchase) === PURCHASE_STATUS.DRAFT);
    const canceled = safePurchases.filter(
      (purchase) => getPurchaseStatus(purchase) === PURCHASE_STATUS.CANCELED
    );
    const confirmedTotal = confirmed.reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);
    return {
      confirmedTotal,
      drafts: drafts.length,
      canceled: canceled.length,
      confirmed: confirmed.length,
    };
  }, [safePurchases]);

  const selectedMovements = useMemo(() => {
    if (!selectedPurchase?.id) {
      return [];
    }
    return inventoryMovements.filter(
      (movement) =>
        (movement.sourceId || movement.source_id) === selectedPurchase.id &&
        (movement.sourceType || movement.source_type) === "purchase"
    );
  }, [inventoryMovements, selectedPurchase]);

  const affectedRecipeCount = useMemo(() => {
    const ids = items.map((item) => item.inventoryItemId).filter(Boolean);
    return safeRecipeBooks.filter((recipeBook) =>
      (recipeBook.ingredients || []).some((ingredient) => ids.includes(ingredient.ingredient_id))
    ).length;
  }, [items, safeRecipeBooks]);

  const resetForm = () => {
    setHeader(createEmptyHeader());
    setItems([createEmptyItem()]);
    setEditingPurchase(null);
    setFeedback({ type: "", message: "" });
  };

  const openCreateForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (purchase) => {
    const form = toFormFromPurchase(purchase);
    setEditingPurchase(purchase);
    setHeader(form.header);
    setItems(form.items.length ? form.items : [createEmptyItem()]);
    setFeedback({ type: "", message: "" });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const updateItemRow = (index, patch) => {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }
        const nextItem = { ...item, ...patch };
        const linkedSupply = nextItem.inventoryItemId ? supplyMap.get(nextItem.inventoryItemId) : null;
        if (linkedSupply) {
          nextItem.manualName = linkedSupply.name || "";
          nextItem.category = patch.category ?? nextItem.category ?? linkedSupply.category ?? "";
          nextItem.unit = patch.unit ?? nextItem.unit ?? linkedSupply.unit ?? "und";
          nextItem.unitCost =
            patch.unitCost ?? nextItem.unitCost ?? linkedSupply.last_purchase_cost ?? linkedSupply.average_cost ?? "";
        }
        return nextItem;
      })
    );
  };

  const buildPayload = (status) => {
    const normalizedItems = items
      .map((item) => {
        const supply = supplyMap.get(item.inventoryItemId);
        const subtotal = calculateItemSubtotal(item);
        const taxes = calculateItemTaxes(item);
        return {
          inventoryItemId: item.inventoryItemId,
          inventoryItemName: supply?.name || item.manualName,
          ingredient_id: item.inventoryItemId,
          ingredient_name: supply?.name || item.manualName,
          category: item.category || supply?.category || "",
          quantity: Number(item.quantity),
          unit: item.unit || supply?.unit || "und",
          unitCost: Number(item.unitCost),
          subtotal,
          taxes,
          apply_iva: item.applyIva,
          iva_pct: Number(item.ivaPct || 0),
          batch: item.batch,
          expirationDate: item.expirationDate,
          notes: item.notes,
        };
      })
      .filter((item) => item.inventoryItemId || normalizeText(item.inventoryItemName));

    return {
      business_id: businessId,
      supplier_id: header.supplierId,
      supplier_name: selectedSupplier?.name || "",
      supplier_payment_terms: selectedSupplier?.payment_terms || selectedSupplier?.paymentTerms || "Contado",
      purchaseNumber: header.purchaseNumber,
      purchase_date: header.purchaseDate,
      notes: header.notes,
      status,
      items: normalizedItems,
    };
  };

  const validateForm = () => {
    if (!header.supplierId) {
      throw new Error("Selecciona un proveedor.");
    }
    if (!items.some((item) => item.inventoryItemId || normalizeText(item.manualName))) {
      throw new Error("Agrega al menos un producto comprado.");
    }
    const invalidItem = items.find((item) => {
      const hasIdentity = item.inventoryItemId || normalizeText(item.manualName);
      return (
        hasIdentity &&
        (!Number.isFinite(Number(item.quantity)) ||
          Number(item.quantity) <= 0 ||
          !Number.isFinite(Number(item.unitCost)) ||
          Number(item.unitCost) < 0)
      );
    });
    if (invalidItem) {
      throw new Error("Cada linea debe tener cantidad mayor a cero y costo unitario valido.");
    }
  };

  const savePurchase = async (status) => {
    setIsSaving(true);
    setFeedback({ type: "", message: "" });
    try {
      validateForm();
      const payload = buildPayload(status);
      if (editingPurchase?.id) {
        await updatePurchase(editingPurchase.id, payload, "Edicion operativa desde modulo de compras");
        if (status === PURCHASE_STATUS.CONFIRMED && getPurchaseStatus(editingPurchase) !== PURCHASE_STATUS.CONFIRMED) {
          await confirmPurchase(editingPurchase.id);
        }
      } else {
        await createPurchase(payload);
      }
      closeForm();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible guardar la compra.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmPurchase = async (purchase) => {
    setIsSaving(true);
    setFeedback({ type: "", message: "" });
    try {
      await confirmPurchase(purchase.id);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible confirmar la compra.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelPurchase = async () => {
    setIsSaving(true);
    try {
      await cancelPurchase(cancelTarget.id, cancelReason);
      setCancelTarget(null);
      setCancelReason("");
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible anular la compra.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterReturn = async () => {
    setIsSaving(true);
    try {
      await registerPurchaseReturn(returnTarget.id, returnTarget.items || [], returnReason);
      setReturnTarget(null);
      setReturnReason("");
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible registrar la devolucion.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-5 rounded-[24px] bg-white/90 p-5 shadow-lg ring-1 ring-slate-200/70 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Abastecimiento auditable
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Compras</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Gestiona borradores, confirmaciones, anulaciones y devoluciones con impacto controlado en inventario, costos y fichas tecnicas.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus size={16} />
          Nueva compra
        </button>
      </div>

      {feedback.message ? (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Confirmadas</p>
          <p className="mt-2 text-lg font-bold text-slate-950">{purchaseStats.confirmed}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Total aplicado</p>
          <p className="mt-2 text-lg font-bold text-slate-950">{formatCOP(purchaseStats.confirmedTotal)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Borradores</p>
          <p className="mt-2 text-lg font-bold text-slate-950">{purchaseStats.drafts}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Anuladas</p>
          <p className="mt-2 text-lg font-bold text-slate-950">{purchaseStats.canceled}</p>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 lg:grid-cols-[1.1fr_0.9fr_0.7fr_0.7fr_1.2fr]">
        <FormSelect
          label="Estado"
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
        >
          <option value="all">Todos</option>
          {Object.values(PURCHASE_STATUS).map((status) => (
            <option key={status} value={status}>
              {STATUS_META[status]?.label || status}
            </option>
          ))}
        </FormSelect>
        <FormSelect
          label="Proveedor"
          value={filters.supplierId}
          onChange={(event) => setFilters((current) => ({ ...current, supplierId: event.target.value }))}
        >
          <option value="all">Todos</option>
          {safeSuppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </FormSelect>
        <FormInput
          label="Desde"
          type="date"
          value={filters.dateFrom}
          onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}
        />
        <FormInput
          label="Hasta"
          type="date"
          value={filters.dateTo}
          onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}
        />
        <label className="grid gap-2 text-sm text-slate-700">
          <span className="font-medium">Busqueda</span>
          <span className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
            <Search size={16} className="text-slate-400" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none"
              placeholder="Numero, proveedor, nota"
            />
          </span>
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-400">
            <tr>
              <th className="px-4 py-3">Numero</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredPurchases.map((purchase) => {
              const status = getPurchaseStatus(purchase);
              const canEdit = status !== PURCHASE_STATUS.CANCELED;
              const canConfirm = status === PURCHASE_STATUS.DRAFT || status === PURCHASE_STATUS.PARTIAL;
              const canCancel = status !== PURCHASE_STATUS.CANCELED;
              const canReturn = status === PURCHASE_STATUS.CONFIRMED;

              return (
                <tr key={purchase.id} className="text-slate-700">
                  <td className="px-4 py-3 font-semibold text-slate-950">{getPurchaseNumber(purchase)}</td>
                  <td className="px-4 py-3">{getPurchaseSupplierName(purchase)}</td>
                  <td className="px-4 py-3">{formatDate(getPurchaseDate(purchase))}</td>
                  <td className="px-4 py-3">
                    <PurchaseStatusBadge status={status} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-950">
                    {formatCOP(Number(purchase.total || 0))}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{getPurchaseUser(purchase)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPurchase(purchase)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                        title="Ver detalle"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditForm(purchase)}
                        disabled={!canEdit}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Editar"
                      >
                        <FileClock size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmPurchase(purchase)}
                        disabled={!canConfirm || isSaving}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Confirmar"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelTarget(purchase)}
                        disabled={!canCancel}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Anular"
                      >
                        <Ban size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setReturnTarget(purchase)}
                        disabled={!canReturn}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Registrar devolucion"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filteredPurchases.length ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  No hay compras con estos filtros.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <PurchaseFormModal
        open={isFormOpen}
        editingPurchase={editingPurchase}
        header={header}
        setHeader={setHeader}
        items={items}
        setItems={setItems}
        updateItemRow={updateItemRow}
        totals={totals}
        suppliers={safeSuppliers}
        supplies={safeSupplies}
        categoryOptions={safeCategoryOptions}
        onManageCategories={onManageCategories}
        affectedRecipeCount={affectedRecipeCount}
        feedback={feedback}
        isSaving={isSaving}
        onClose={closeForm}
        onSaveDraft={() => savePurchase(PURCHASE_STATUS.DRAFT)}
        onConfirm={() => savePurchase(PURCHASE_STATUS.CONFIRMED)}
      />

      <PurchaseDetailModal
        purchase={selectedPurchase}
        movements={selectedMovements}
        onClose={() => setSelectedPurchase(null)}
      />

      <ReasonModal
        open={Boolean(cancelTarget)}
        title="Anular compra"
        description="La compra no se elimina. Se registrara una reversa de inventario y quedara auditoria del motivo."
        value={cancelReason}
        onChange={setCancelReason}
        confirmLabel="Anular compra"
        confirmTone="danger"
        isSaving={isSaving}
        onConfirm={handleCancelPurchase}
        onCancel={() => {
          setCancelTarget(null);
          setCancelReason("");
        }}
      />

      <ReasonModal
        open={Boolean(returnTarget)}
        title="Registrar devolucion"
        description="Esta version prepara la devolucion total con movimientos inversos. Luego puede evolucionar a seleccion parcial por linea."
        value={returnReason}
        onChange={setReturnReason}
        confirmLabel="Registrar devolucion"
        confirmTone="neutral"
        isSaving={isSaving}
        onConfirm={handleRegisterReturn}
        onCancel={() => {
          setReturnTarget(null);
          setReturnReason("");
        }}
      />
    </section>
  );
}

function PurchaseFormModal({
  open,
  editingPurchase,
  header,
  setHeader,
  items,
  setItems,
  updateItemRow,
  totals,
  suppliers,
  supplies,
  categoryOptions,
  onManageCategories,
  affectedRecipeCount,
  feedback,
  isSaving,
  onClose,
  onSaveDraft,
  onConfirm,
}) {
  const addItemRow = () => setItems((current) => [...current, createEmptyItem()]);
  const removeItemRow = (index) =>
    setItems((current) => (current.length === 1 ? [createEmptyItem()] : current.filter((_, itemIndex) => itemIndex !== index)));
  const isCanceled = getPurchaseStatus(editingPurchase || {}) === PURCHASE_STATUS.CANCELED;

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-6xl"
      title={editingPurchase ? "Editar compra" : "Nueva compra"}
      description="Guarda borradores sin impacto o confirma cuando la factura ya debe entrar a inventario y costos."
    >
      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
        <section className="grid gap-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 lg:grid-cols-4">
          <FormSelect
            label="Proveedor"
            required
            value={header.supplierId}
            onChange={(event) => setHeader((current) => ({ ...current, supplierId: event.target.value }))}
          >
            <option value="">Seleccionar proveedor</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </FormSelect>
          <FormInput
            label="Numero interno"
            value={header.purchaseNumber}
            onChange={(event) => setHeader((current) => ({ ...current, purchaseNumber: event.target.value }))}
            placeholder="Auto si queda vacio"
          />
          <FormInput
            label="Fecha compra"
            type="date"
            required
            value={header.purchaseDate}
            onChange={(event) => setHeader((current) => ({ ...current, purchaseDate: event.target.value }))}
          />
          <FormInput
            label="Observaciones"
            value={header.notes}
            onChange={(event) => setHeader((current) => ({ ...current, notes: event.target.value }))}
          />
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Detalle de productos comprados</p>
              <p className="text-sm text-slate-500">
                {affectedRecipeCount} ficha(s) tecnica(s) podrian actualizar su costo al confirmar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onManageCategories?.()}
              disabled={!onManageCategories}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
            >
              <Settings2 size={16} />
              Categorias
            </button>
          </div>

          {items.map((item, index) => {
            const subtotal = calculateItemSubtotal(item);
            const taxes = calculateItemTaxes(item);
            return (
              <article key={`purchase-item-${index}`} className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">Linea {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-700"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="grid gap-4 xl:grid-cols-4">
                  <FormSelect
                    label="Insumo"
                    value={item.inventoryItemId}
                    onChange={(event) => updateItemRow(index, { inventoryItemId: event.target.value })}
                  >
                    <option value="">Crear nuevo / manual</option>
                    {supplies.map((supply) => (
                      <option key={supply.id} value={supply.id}>
                        {supply.name}
                      </option>
                    ))}
                  </FormSelect>
                  <FormInput
                    label="Nuevo insumo"
                    value={item.manualName}
                    onChange={(event) =>
                      updateItemRow(index, { inventoryItemId: "", manualName: event.target.value })
                    }
                  />
                  <FormInput
                    label="Cantidad"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(event) => updateItemRow(index, { quantity: event.target.value })}
                  />
                  <FormSelect
                    label="Unidad"
                    value={item.unit}
                    onChange={(event) => updateItemRow(index, { unit: event.target.value })}
                  >
                    {SUPPLY_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </FormSelect>
                  <FormInput
                    label="Costo unitario"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitCost}
                    onChange={(event) => updateItemRow(index, { unitCost: event.target.value })}
                  />
                  <FormSelect
                    label="Categoria"
                    value={item.category}
                    onChange={(event) => updateItemRow(index, { category: event.target.value })}
                    options={categoryOptions}
                  />
                  <FormInput
                    label="Lote"
                    value={item.batch}
                    onChange={(event) => updateItemRow(index, { batch: event.target.value })}
                  />
                  <FormInput
                    label="Vencimiento"
                    type="date"
                    value={item.expirationDate}
                    onChange={(event) => updateItemRow(index, { expirationDate: event.target.value })}
                  />
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-[0.7fr_1fr_1fr]">
                  <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200">
                    <input
                      type="checkbox"
                      checked={item.applyIva}
                      onChange={(event) => updateItemRow(index, { applyIva: event.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    IVA separado
                  </label>
                  <FormInput
                    label="IVA %"
                    type="number"
                    min="0"
                    step="1"
                    disabled={!item.applyIva}
                    value={item.ivaPct}
                    onChange={(event) => updateItemRow(index, { ivaPct: event.target.value })}
                  />
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm ring-1 ring-slate-200">
                    <p className="font-semibold text-slate-950">{formatCOP(subtotal + taxes)}</p>
                    <p className="text-slate-500">Subtotal {formatCOP(subtotal)} · Impuestos {formatCOP(taxes)}</p>
                  </div>
                </div>
              </article>
            );
          })}

          <button
            type="button"
            onClick={addItemRow}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            <Plus size={16} />
            Agregar linea
          </button>
        </section>

        <section className="grid gap-3 rounded-xl bg-slate-950 p-4 text-white md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Subtotal</p>
            <p className="mt-1 text-lg font-bold">{formatCOP(totals.subtotal)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Impuestos</p>
            <p className="mt-1 text-lg font-bold">{formatCOP(totals.taxes)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Total</p>
            <p className="mt-1 text-lg font-bold">{formatCOP(totals.total)}</p>
          </div>
        </section>

        {feedback.message ? (
          <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
            {feedback.message}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving || isCanceled}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 disabled:opacity-50"
          >
            <Save size={16} />
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving || isCanceled}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            <PackageCheck size={16} />
            Confirmar compra
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function PurchaseDetailModal({ purchase, movements, onClose }) {
  if (!purchase) {
    return null;
  }

  const history = Array.isArray(purchase.history) ? purchase.history : [];
  const audit = purchase.audit || {};

  return (
    <ModalWrapper
      open={Boolean(purchase)}
      onClose={onClose}
      maxWidthClass="max-w-5xl"
      title={`Compra ${getPurchaseNumber(purchase)}`}
      description="Resumen operativo, productos, movimientos de inventario y auditoria."
    >
      <div className="space-y-5">
        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Estado</p>
            <div className="mt-2">
              <PurchaseStatusBadge status={getPurchaseStatus(purchase)} />
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Proveedor</p>
            <p className="mt-2 font-semibold text-slate-950">{getPurchaseSupplierName(purchase)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Fecha</p>
            <p className="mt-2 font-semibold text-slate-950">{formatDate(getPurchaseDate(purchase))}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Total</p>
            <p className="mt-2 font-semibold text-slate-950">{formatCOP(Number(purchase.total || 0))}</p>
          </div>
        </section>

        <DetailTable
          title="Productos"
          headers={["Insumo", "Cantidad", "Costo unitario", "Subtotal", "Lote"]}
          rows={(purchase.items || []).map((item) => [
            item.inventoryItemName || item.ingredient_name,
            `${item.quantity || 0} ${item.unit || ""}`,
            formatCOP(Number(item.unitCost ?? item.unit_cost ?? item.unit_price ?? 0)),
            formatCOP(Number(item.subtotal ?? item.line_total ?? item.total_cost ?? 0)),
            item.batch || "Sin lote",
          ])}
        />

        <DetailTable
          title="Movimientos inventario"
          headers={["Tipo", "Insumo", "Cantidad", "Costo", "Fecha"]}
          rows={movements.map((movement) => [
            movement.movementType || movement.movement_type || movement.type,
            movement.inventoryItemName || movement.inventory_item_id,
            `${movement.direction === "out" ? "-" : "+"}${movement.quantity || 0} ${movement.unit || ""}`,
            formatCOP(Number(movement.totalCost || 0)),
            getTimestampLabel(movement.createdAt),
          ])}
          empty="Sin movimientos registrados para esta compra."
        />

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-slate-950">Auditoria</p>
            <dl className="mt-3 grid gap-2 text-sm text-slate-600">
              <div className="flex justify-between gap-4">
                <dt>Creada por</dt>
                <dd className="font-medium text-slate-900">{audit.createdBy || getPurchaseUser(purchase)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Confirmada por</dt>
                <dd className="font-medium text-slate-900">{audit.confirmedBy || "Pendiente"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Anulada por</dt>
                <dd className="font-medium text-slate-900">{audit.canceledBy || "No aplica"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Motivo anulacion</dt>
                <dd className="max-w-xs text-right font-medium text-slate-900">{audit.cancelReason || "No aplica"}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-slate-950">Historial</p>
            <div className="mt-3 space-y-2">
              {history.length ? (
                history.map((event, index) => (
                  <div key={`${event.type}-${index}`} className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
                    <p className="font-semibold text-slate-900">{event.type || "evento"}</p>
                    <p className="text-slate-500">
                      {event.status || "sin estado"} · {event.reason || "sin motivo"} · {event.at || "fecha servidor"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Sin historial detallado.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </ModalWrapper>
  );
}

function DetailTable({ title, headers, rows, empty = "Sin datos." }) {
  return (
    <section className="rounded-xl bg-white ring-1 ring-slate-200">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-semibold text-slate-950">{title}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-400">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length ? (
              rows.map((row, rowIndex) => (
                <tr key={`detail-row-${rowIndex}`} className="text-slate-700">
                  {row.map((cell, cellIndex) => (
                    <td key={`detail-cell-${cellIndex}`} className="px-4 py-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-4 py-6 text-center text-sm text-slate-500">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReasonModal({
  open,
  title,
  description,
  value,
  onChange,
  confirmLabel,
  confirmTone,
  isSaving,
  onConfirm,
  onCancel,
}) {
  const isDanger = confirmTone === "danger";
  return (
    <ModalWrapper open={open} onClose={onCancel} maxWidthClass="max-w-lg" title={title} description={description}>
      <div className="space-y-4">
        <div className={`rounded-xl p-4 text-sm ring-1 ${isDanger ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-sky-50 text-sky-700 ring-sky-200"}`}>
          Esta accion genera movimientos de inventario trazables y no elimina el documento original.
        </div>
        <FormInput
          label="Motivo obligatorio"
          multiline
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Explica la causa operativa"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving || !normalizeText(value)}
            className={`rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 ${isDanger ? "bg-rose-600" : "bg-sky-600"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
