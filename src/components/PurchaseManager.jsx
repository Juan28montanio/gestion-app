import { useMemo, useState } from "react";
import { ClipboardList, Plus, Settings2, Trash2, X } from "lucide-react";
import { createPurchase } from "../services/purchaseService";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import ModalWrapper from "./ModalWrapper";
import { formatCOP } from "../utils/formatters";
import { SUPPLY_UNITS } from "../utils/resourceOptions";

const EMPTY_HEADER = {
  supplierId: "",
  invoiceNumber: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
};

const EMPTY_ITEM = {
  ingredientId: "",
  manualName: "",
  category: "",
  quantity: "",
  unit: "g",
  lineTotal: "",
  applyIva: false,
  ivaPct: "19",
};

function buildSupplyMap(supplies) {
  return new Map(supplies.map((supply) => [supply.id, supply]));
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
  const [step, setStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [header, setHeader] = useState(EMPTY_HEADER);
  const [items, setItems] = useState([EMPTY_ITEM]);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const safeSupplies = Array.isArray(supplies) ? supplies : [];
  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const safeRecipeBooks = Array.isArray(recipeBooks) ? recipeBooks : [];
  const safeCategoryOptions = Array.isArray(categoryOptions) ? categoryOptions : [];
  const supplyMap = useMemo(() => buildSupplyMap(safeSupplies), [safeSupplies]);

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const lineTotal = Number(item.lineTotal);
        return sum + (Number.isFinite(lineTotal) ? lineTotal : 0);
      }, 0),
    [items]
  );

  const purchaseStats = useMemo(() => {
    const totalPurchases = safePurchases.reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);
    const averageTicket = safePurchases.length ? totalPurchases / safePurchases.length : 0;
    const uniqueSuppliers = new Set(
      safePurchases.map((purchase) => purchase.supplier_id).filter(Boolean)
    ).size;

    return {
      totalPurchases,
      averageTicket,
      uniqueSuppliers,
      count: safePurchases.length,
    };
  }, [safePurchases]);

  const draftImpact = useMemo(() => {
    const normalizedItems = items.filter((item) => Number(item.quantity || 0) > 0);
    const linkedSupplyIds = normalizedItems.map((item) => item.ingredientId).filter(Boolean);
    const newSupplies = normalizedItems.filter(
      (item) => !item.ingredientId && String(item.manualName || "").trim()
    ).length;
    const generatedStock = normalizedItems.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
    const affectedRecipeCount = safeRecipeBooks.filter((recipeBook) =>
      (recipeBook.ingredients || []).some((ingredient) =>
        linkedSupplyIds.includes(ingredient.ingredient_id)
      )
    ).length;

    return {
      lineCount: normalizedItems.length,
      newSupplies,
      generatedStock,
      affectedRecipeCount,
    };
  }, [items, safeRecipeBooks]);

  const closeModal = () => {
    setIsModalOpen(false);
    setStep(1);
    setHeader(EMPTY_HEADER);
    setItems([EMPTY_ITEM]);
    setFeedback({ type: "", message: "" });
  };

  const openModal = () => {
    setStep(1);
    setFeedback({ type: "", message: "" });
    setIsModalOpen(true);
  };

  const addItemRow = () => {
    setItems((current) => [...current, EMPTY_ITEM]);
  };

  const updateItemRow = (index, patch) => {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const nextItem = { ...item, ...patch };
        const linkedSupply = nextItem.ingredientId ? supplyMap.get(nextItem.ingredientId) : null;

        if (linkedSupply) {
          nextItem.manualName = "";
          nextItem.category = patch.category ?? nextItem.category ?? linkedSupply.category ?? "";
          nextItem.unit = patch.unit ?? nextItem.unit ?? linkedSupply.unit ?? "und";
        }

        return nextItem;
      })
    );
  };

  const removeItemRow = (index) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const selectedSupplier = safeSuppliers.find((item) => item.id === header.supplierId);
  const supplierPurchaseHistory = useMemo(() => {
    if (!header.supplierId) {
      return {
        purchasesCount: 0,
        totalBought: 0,
        lastPurchaseDate: "",
      };
    }

    const linkedPurchases = safePurchases.filter(
      (purchase) => purchase.supplier_id === header.supplierId
    );

    return {
      purchasesCount: linkedPurchases.length,
      totalBought: linkedPurchases.reduce((sum, purchase) => sum + Number(purchase.total || 0), 0),
      lastPurchaseDate: linkedPurchases[0]?.purchase_date || "",
    };
  }, [header.supplierId, safePurchases]);
  const purchaseFlowInsights = useMemo(() => {
    const paymentTerm = String(
      selectedSupplier?.payment_terms || selectedSupplier?.paymentTerms || "Contado"
    ).trim();

    return [
      {
        title: "Impacto en abastecimiento",
        body:
          draftImpact.newSupplies > 0
            ? `Esta compra crearia ${draftImpact.newSupplies} insumo(s) nuevo(s) y actualizaria stock inmediato para ${draftImpact.lineCount} linea(s).`
            : `Esta compra reforzaria stock en ${draftImpact.lineCount} linea(s) ya conectadas al inventario.`,
      },
      {
        title: "Impacto en costeo",
        body:
          draftImpact.affectedRecipeCount > 0
            ? `${draftImpact.affectedRecipeCount} ficha(s) tecnica(s) quedarian expuestas a nuevo costo promedio despues del registro.`
            : "No hay fichas tecnicas conectadas a estos insumos todavia. El siguiente paso deberia ser costear esa relacion.",
      },
      {
        title: "Impacto en caja",
        body:
          paymentTerm.toLowerCase() === "credito"
            ? "El proveedor opera a credito. Registra la compra con disciplina porque el gasto afecta analisis del periodo aunque no salga efectivo hoy."
            : "El proveedor opera de contado. Esta compra presiona caja desde el momento del registro y conviene cruzarla con el cierre del turno.",
      },
    ];
  }, [draftImpact, selectedSupplier]);
  const purchaseRecommendations = useMemo(() => {
    return safeSupplies
      .map((supply) => {
        const stock = Number(supply.stock || 0);
        const min = Number(supply.stock_min_alert || 0);
        const deficit = Math.max(min - stock, 0);
        const linkedRecipes = safeRecipeBooks.filter((recipeBook) =>
          (recipeBook.ingredients || []).some((ingredient) => ingredient.ingredient_id === supply.id)
        ).length;
        const urgency = stock <= 0 ? 3 : stock <= min ? 2 : stock <= min * 1.15 ? 1 : 0;

        return {
          id: supply.id,
          name: supply.name || "Insumo sin nombre",
          deficit,
          unit: supply.unit || "und",
          linkedRecipes,
          urgency,
          averageCost: Number(
            supply.last_purchase_cost ?? supply.average_cost ?? supply.cost_per_unit ?? 0
          ),
        };
      })
      .filter((supply) => supply.urgency > 0)
      .sort((a, b) => {
        if (b.urgency !== a.urgency) {
          return b.urgency - a.urgency;
        }
        if (b.linkedRecipes !== a.linkedRecipes) {
          return b.linkedRecipes - a.linkedRecipes;
        }
        return b.deficit - a.deficit;
      })
      .slice(0, 4);
  }, [safeRecipeBooks, safeSupplies]);

  const handleNextStep = () => {
    if (!header.supplierId) {
      setFeedback({
        type: "error",
        message: "Debes seleccionar un proveedor antes de cargar items.",
      });
      return;
    }

    setFeedback({ type: "", message: "" });
    setStep(2);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      await createPurchase({
        business_id: businessId,
        supplier_id: header.supplierId,
        supplier_name: selectedSupplier?.name || "",
        invoice_number: header.invoiceNumber,
        purchase_date: header.purchaseDate,
        items: items.map((item) => {
          const ingredient = supplyMap.get(item.ingredientId);
          return {
            ingredient_id: item.ingredientId,
            ingredient_name: ingredient?.name || item.manualName,
            manual_name: item.manualName,
            category: item.category || ingredient?.category || "",
            quantity: Number(item.quantity),
            line_total: Number(item.lineTotal),
            apply_iva: item.applyIva,
            iva_pct: Number(item.ivaPct),
            unit: item.unit || ingredient?.unit || "und",
          };
        }),
      });

      closeModal();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "No fue posible registrar la compra.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Compras</h2>
          <p className="text-sm text-slate-500">
            Registra facturas, crea insumos faltantes y actualiza stock con impacto en costeo.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20"
        >
          <Plus size={16} />
          Nueva compra
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-[28px] bg-slate-50 p-5 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Resumen
          </p>
          <p className="mt-3 text-3xl font-black text-slate-950">{formatCOP(total)}</p>
          <p className="mt-2 text-sm text-slate-500">Total estimado de la factura en edicion.</p>

          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Compras registradas
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{purchaseStats.count}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Ticket promedio
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {formatCOP(purchaseStats.averageTicket)}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Proveedores activos
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {purchaseStats.uniqueSuppliers}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-[22px] bg-white px-4 py-4 ring-1 ring-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Prioridades de reposicion
            </p>
            <div className="mt-3 space-y-3">
              {purchaseRecommendations.length ? (
                purchaseRecommendations.map((supply) => (
                  <article
                    key={supply.id}
                    className="rounded-2xl bg-slate-50 px-3 py-3 ring-1 ring-slate-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{supply.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {supply.linkedRecipes > 0
                            ? `${supply.linkedRecipes} ficha(s) tecnica(s) dependen de este insumo.`
                            : "Aun no esta conectado a fichas tecnicas."}
                        </p>
                      </div>
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                        Falta {supply.deficit > 0 ? `${supply.deficit} ${supply.unit}` : "stock"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Ultimo costo de referencia: {formatCOP(supply.averageCost)}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-500">
                  No hay alertas inmediatas de reposicion. Puedes usar este espacio para validar si la siguiente compra sera preventiva o reactiva.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 xl:grid-cols-3">
            {purchaseFlowInsights.map((insight) => (
              <article
                key={insight.title}
                className="rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Flujo de compra
                </p>
                <h3 className="mt-2 text-base font-semibold text-slate-900">{insight.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{insight.body}</p>
              </article>
            ))}
          </div>

          <div className="overflow-x-auto rounded-[28px] bg-slate-50 p-4 ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-3 pr-4">Factura</th>
                <th className="py-3 pr-4">Proveedor</th>
                <th className="py-3 pr-4">Fecha</th>
                <th className="py-3 pr-4">Items</th>
                <th className="py-3 pr-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {safePurchases.map((purchase) => (
                <tr key={purchase.id} className="border-b border-slate-100 text-slate-700">
                  <td className="py-3 pr-4 font-semibold text-slate-900">
                    {purchase.invoice_number}
                  </td>
                  <td className="py-3 pr-4">{purchase.supplier_name}</td>
                  <td className="py-3 pr-4">{purchase.purchase_date}</td>
                  <td className="py-3 pr-4">{purchase.items?.length || 0}</td>
                  <td className="py-3 pr-4 text-right font-semibold text-slate-900">
                    {formatCOP(purchase.total || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      <ModalWrapper
        open={isModalOpen}
        onClose={closeModal}
        maxWidthClass="max-w-6xl"
        icon={{ main: <ClipboardList size={20} />, close: <X size={18} /> }}
        title="Registrar compra"
        description={`Paso ${step} de 2: ${
          step === 1
            ? "Completa los datos generales de la compra."
            : "Carga los items y revisa el impacto antes de guardar."
        }`}
      >
        <form onSubmit={handleSubmit} className="grid gap-6">
          {step === 1 ? (
            <section className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200 md:grid-cols-3">
              <FormSelect
                className="md:col-span-2"
                label="Proveedor"
                value={header.supplierId}
                onChange={(event) =>
                  setHeader((current) => ({ ...current, supplierId: event.target.value }))
                }
              >
                <option value="">Seleccionar proveedor</option>
                {safeSuppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </FormSelect>

              <FormInput
                label="Fecha"
                type="date"
                value={header.purchaseDate}
                onChange={(event) =>
                  setHeader((current) => ({ ...current, purchaseDate: event.target.value }))
                }
              />

              <FormInput
                className="md:col-span-3"
                label="No. factura"
                value={header.invoiceNumber}
                onChange={(event) =>
                  setHeader((current) => ({ ...current, invoiceNumber: event.target.value }))
                }
              />

              {selectedSupplier ? (
                <div className="md:col-span-3 rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Proveedor seleccionado
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {selectedSupplier.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Plazo: {selectedSupplier.payment_terms || selectedSupplier.paymentTerms || "Contado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Historial con este proveedor
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {supplierPurchaseHistory.purchasesCount} compra{supplierPurchaseHistory.purchasesCount === 1 ? "" : "s"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Ultima: {supplierPurchaseHistory.lastPurchaseDate || "Sin historial"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Volumen historico
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {formatCOP(supplierPurchaseHistory.totalBought)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Te ayuda a decidir si esta compra sostiene caja o credito.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          ) : (
            <section className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-slate-50 px-5 py-4 ring-1 ring-slate-200">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Proveedor activo
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedSupplier?.name || "Sin proveedor"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedSupplier?.payment_terms || selectedSupplier?.paymentTerms || "Contado"} · Ultima compra{" "}
                    {supplierPurchaseHistory.lastPurchaseDate || "sin historial"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onManageCategories}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Settings2 size={16} />
                  Categorias de insumo
                </button>
              </div>

              <div className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="hidden gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 xl:grid xl:grid-cols-[1fr_1fr_0.65fr_0.45fr_0.7fr_0.75fr_auto]">
                  <span>Insumo existente</span>
                  <span>Nuevo insumo</span>
                  <span>Cantidad</span>
                  <span>Unidad</span>
                  <span>Categoria</span>
                  <span>Valor total</span>
                  <span />
                </div>

                <div className="mt-4 grid gap-3">
                  {items.map((item, index) => (
                    <div
                      key={`purchase-item-${index}`}
                      className="grid gap-3 rounded-[24px] bg-white p-4 ring-1 ring-slate-200 xl:grid-cols-[1fr_1fr_0.65fr_0.45fr_0.7fr_0.75fr_auto]"
                    >
                      <FormSelect
                        label="Insumo existente"
                        value={item.ingredientId}
                        onChange={(event) =>
                          updateItemRow(index, { ingredientId: event.target.value })
                        }
                      >
                        <option value="">Seleccionar insumo</option>
                        {safeSupplies.map((supply) => (
                          <option key={supply.id} value={supply.id}>
                            {supply.name}
                          </option>
                        ))}
                      </FormSelect>

                      <FormInput
                        label="Nuevo insumo"
                        value={item.manualName}
                        onChange={(event) =>
                          updateItemRow(index, {
                            ingredientId: "",
                            manualName: event.target.value,
                          })
                        }
                        hint="Si no existe, se crea automaticamente."
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

                      <FormSelect
                        label="Categoria"
                        value={item.category}
                        onChange={(event) => updateItemRow(index, { category: event.target.value })}
                        options={safeCategoryOptions}
                      />

                      <div className="grid gap-3">
                        <FormInput
                          label="Valor total item"
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.lineTotal}
                          onChange={(event) => updateItemRow(index, { lineTotal: event.target.value })}
                          hint="Usa el valor final que trae la factura."
                        />

                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={item.applyIva}
                            onChange={(event) => updateItemRow(index, { applyIva: event.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          IVA separado
                        </label>

                        {item.applyIva ? (
                          <FormInput
                            label="IVA %"
                            type="number"
                            min="0"
                            step="1"
                            value={item.ivaPct}
                            onChange={(event) => updateItemRow(index, { ivaPct: event.target.value })}
                          />
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        className="mt-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                <Plus size={16} />
                Agregar item
              </button>

              <div className="rounded-[24px] border border-sky-200 bg-sky-50/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                  Impacto de esta compra
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-sky-100">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      Lineas cargadas
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {draftImpact.lineCount}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-sky-100">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      Stock ingresado
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {draftImpact.generatedStock}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-sky-100">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      Insumos nuevos
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {draftImpact.newSupplies}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-sky-100">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      Recetas afectadas
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {draftImpact.affectedRecipeCount}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  Al guardar, SmartProfit actualizara el stock, recalculara el costo promedio y refrescara las fichas tecnicas conectadas a los insumos existentes.
                </p>
              </div>
            </section>
          )}

          {feedback.message ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
              {feedback.message}
            </div>
          ) : null}

          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/70 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Total de factura
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950">{formatCOP(total)}</p>
              </div>
              <p className="max-w-md text-sm text-slate-500">
                El total se recalcula con el valor final de cada item. Si separas IVA, el sistema conserva el costo real del insumo y el total pagado en la factura.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                >
                  Continuar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? "Guardando..." : "Guardar compra"}
                </button>
              </>
            )}
          </div>
        </form>
      </ModalWrapper>
    </section>
  );
}
