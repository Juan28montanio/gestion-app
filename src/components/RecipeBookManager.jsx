import { useEffect, useMemo, useState } from "react";
import { Copy, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  createRecipeBook,
  deactivateRecipeBook,
  updateRecipeBook,
} from "../services/recipeBookService";
import { uploadRecipeImage } from "../services/storageService";
import ConfirmModal from "./ConfirmModal";
import { formatCOP } from "../utils/formatters";
import {
  STATUS_LABELS,
  TECHNICAL_SHEET_STATUSES,
  TECHNICAL_SHEET_TYPES,
  TYPE_LABELS,
  buildComponentSourceOptions,
  buildPayloadFromForm,
  buildRecipeForm,
  buildRecipeOperationalSummary,
  buildRecipeReferenceMap,
  buildRecipeSummary,
  buildSupplyReferenceMap,
  createEmptyComponent,
  createEmptyRecipeForm,
  getTechnicalSheetCosting,
  getTechnicalSheetName,
  getTechnicalSheetStatus,
  getTechnicalSheetType,
  validateRecipeForm,
} from "../features/resources/recipes/recipeBookHelpers";
import {
  calculateComponentCost,
  calculateTechnicalSheetCosting,
  calculateUsefulYield,
} from "../features/resources/recipes/technicalSheetCalculations";
import RecipeBookEditorModal from "../features/resources/recipes/RecipeBookEditorModal";
import {
  getSupplyBaseUnit,
  getSupplyCostPerBaseUnit,
} from "../features/resources/inventory/supplyCalculations";

function normalizeComparableValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function StatusBadge({ status }) {
  const classes = {
    active: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    inactive: "bg-slate-100 text-slate-600 ring-slate-200",
    draft: "bg-amber-100 text-amber-700 ring-amber-200",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${classes[status] || classes.draft}`}>
      {STATUS_LABELS[status] || "Borrador"}
    </span>
  );
}

function FinancialBadge({ costing }) {
  const margin = Number(costing.grossMarginPercent || 0);
  const tone =
    margin >= 65
      ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
      : margin > 0 && margin < 30
        ? "bg-rose-100 text-rose-700 ring-rose-200"
        : "bg-amber-100 text-amber-700 ring-amber-200";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tone}`}>
      Margen {margin.toFixed(1)}%
    </span>
  );
}

function DetailBlock({ title, children }) {
  return (
    <section className="rounded-[24px] bg-white p-5 ring-1 ring-slate-200">
      <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function RecipeBookManager({
  businessId,
  products,
  supplies,
  recipeBooks,
  focusedProductId,
  onFocusHandled,
}) {
  const [form, setForm] = useState(createEmptyRecipeForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("general");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [sheetToDeactivate, setSheetToDeactivate] = useState(null);
  const [detailSheet, setDetailSheet] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    category: "",
    status: "",
  });

  const safeProducts = Array.isArray(products) ? products : [];
  const safeSupplies = Array.isArray(supplies) ? supplies : [];
  const safeRecipeBooks = Array.isArray(recipeBooks) ? recipeBooks : [];
  const supplyReferenceMap = useMemo(() => buildSupplyReferenceMap(safeSupplies), [safeSupplies]);
  const recipeReferenceMap = useMemo(
    () => buildRecipeReferenceMap(safeRecipeBooks),
    [safeRecipeBooks]
  );
  const sourceOptions = useMemo(
    () =>
      buildComponentSourceOptions({
        supplies: safeSupplies,
        recipeBooks: safeRecipeBooks,
        editingId,
      }),
    [editingId, safeRecipeBooks, safeSupplies]
  );
  const sourceMap = useMemo(
    () =>
      sourceOptions.reduce((acc, option) => {
        acc[`${option.sourceType}:${option.id}`] = option;
        return acc;
      }, {}),
    [sourceOptions]
  );

  const categoryOptions = useMemo(() => {
    const categories = new Set([
      ...safeProducts.map((product) => product.category).filter(Boolean),
      ...safeRecipeBooks.map((sheet) => sheet.category).filter(Boolean),
    ]);
    return [...categories].sort((left, right) =>
      left.localeCompare(right, "es", { sensitivity: "base" })
    );
  }, [safeProducts, safeRecipeBooks]);

  const previewComponents = useMemo(
    () =>
      form.components.map((component) => ({
        ...component,
        quantity: Number(component.quantity || 0),
        unitCost: Number(component.unitCost || 0),
        wastePercent: Number(component.wastePercent || 0),
      })),
    [form.components]
  );
  const previewCosting = useMemo(
    () =>
      calculateTechnicalSheetCosting({
        components: previewComponents,
        yieldData: {
          quantity: Number(form.yieldQuantity || 0),
          portions: Number(form.portions || 0),
          wastePercent: Number(form.wastePercent || 0),
        },
        costing: {
          currentSalePrice: Number(form.currentSalePrice || 0),
          targetFoodCost: Number(form.targetFoodCost || 30),
        },
      }),
    [
      form.currentSalePrice,
      form.portions,
      form.targetFoodCost,
      form.wastePercent,
      form.yieldQuantity,
      previewComponents,
    ]
  );
  const validationMessage = useMemo(() => validateRecipeForm(form), [form]);
  const canSaveRecipe = !validationMessage;
  const recipeSummary = useMemo(() => buildRecipeSummary(safeRecipeBooks), [safeRecipeBooks]);
  const recipeOperationalSummary = useMemo(
    () => buildRecipeOperationalSummary(safeRecipeBooks, safeSupplies),
    [safeRecipeBooks, safeSupplies]
  );

  const filteredSheets = useMemo(() => {
    const search = normalizeComparableValue(filters.search);

    return safeRecipeBooks.filter((sheet) => {
      const name = normalizeComparableValue(getTechnicalSheetName(sheet));
      const matchesSearch = !search || name.includes(search);
      const matchesType = !filters.type || getTechnicalSheetType(sheet) === filters.type;
      const matchesCategory = !filters.category || sheet.category === filters.category;
      const matchesStatus = !filters.status || getTechnicalSheetStatus(sheet) === filters.status;

      return matchesSearch && matchesType && matchesCategory && matchesStatus;
    });
  }, [filters, safeRecipeBooks]);

  useEffect(() => {
    if (!focusedProductId) {
      return;
    }

    const product = safeProducts.find((item) => item.id === focusedProductId);
    const matchingRecipe = safeRecipeBooks.find((recipeBook) => recipeBook.product_id === focusedProductId);

    if (matchingRecipe) {
      openEditModal(matchingRecipe);
      onFocusHandled?.();
      return;
    }

    setEditingId(null);
    setActiveModalTab("general");
    setForm({
      ...createEmptyRecipeForm(),
      productId: focusedProductId,
      name: product?.name || "",
      category: product?.category || "",
      currentSalePrice: String(product?.price ?? ""),
      type: "final_product",
    });
    setFeedback({ type: "", message: "" });
    setIsModalOpen(true);
    onFocusHandled?.();
  }, [focusedProductId, onFocusHandled, safeProducts, safeRecipeBooks]);

  const refreshComponentCosts = (components) =>
    components.map((component) => {
      const source =
        component.sourceType === "technical_sheet"
          ? recipeReferenceMap[component.sourceId]
          : supplyReferenceMap[component.sourceId];
      const sourceCosting = component.sourceType === "technical_sheet"
        ? getTechnicalSheetCosting(source)
        : null;
      const sourceYield = source?.yield || {};
      const usefulYield =
        Number(sourceYield.usefulYield || sourceYield.useful_yield) ||
        calculateUsefulYield(sourceYield) ||
        Number(sourceYield.portions || 1);
      const fallbackUnitCost =
        component.sourceType === "technical_sheet"
          ? Number(sourceCosting?.totalCost || 0) / Math.max(usefulYield, 0.0001)
          : getSupplyCostPerBaseUnit(source);
      const normalized = {
        ...component,
        unit:
          component.sourceType === "technical_sheet"
            ? component.unit
            : component.unit || getSupplyBaseUnit(source),
        unitCost: component.unitCost === "" ? String(fallbackUnitCost || 0) : component.unitCost,
      };

      return {
        ...normalized,
        totalCost: calculateComponentCost({
          quantity: Number(normalized.quantity || 0),
          unitCost: Number(normalized.unitCost || 0),
          wastePercent: Number(normalized.wastePercent || 0),
        }),
      };
    });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      components: refreshComponentCosts(current.components),
    }));
  }, [recipeReferenceMap, supplyReferenceMap]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setActiveModalTab("general");
    setForm(createEmptyRecipeForm());
    setFeedback({ type: "", message: "" });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setActiveModalTab("general");
    setForm(createEmptyRecipeForm());
    setFeedback({ type: "", message: "" });
    setIsModalOpen(true);
  };

  function openEditModal(sheet) {
    setEditingId(sheet.id);
    setActiveModalTab("general");
    setForm(buildRecipeForm(sheet));
    setFeedback({ type: "", message: "" });
    setIsModalOpen(true);
  }

  const addComponentRow = () => {
    setForm((current) => ({
      ...current,
      components: [...current.components, createEmptyComponent()],
    }));
  };

  const updateComponentRow = (index, field, value) => {
    setForm((current) => ({
      ...current,
      components: refreshComponentCosts(
        current.components.map((component, componentIndex) =>
          componentIndex === index ? { ...component, [field]: value } : component
        )
      ),
    }));
  };

  const removeComponentRow = (index) => {
    setForm((current) => ({
      ...current,
      components: current.components.filter((_, componentIndex) => componentIndex !== index),
    }));
  };

  const duplicateSheet = (sheet) => {
    const duplicateForm = buildRecipeForm(sheet);
    setEditingId(null);
    setActiveModalTab("general");
    setForm({
      ...duplicateForm,
      name: `${duplicateForm.name} copia`,
      code: "",
      status: "draft",
      productId: "",
    });
    setFeedback({ type: "", message: "" });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingImage(true);
    setFeedback({ type: "", message: "" });

    try {
      const imageUrl = await uploadRecipeImage({
        businessId,
        productId: form.productId || editingId || "draft",
        file,
      });

      setForm((current) => ({ ...current, imageUrl }));
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "No fue posible subir la imagen de referencia.",
      });
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const currentValidation = validateRecipeForm(form);

    if (currentValidation) {
      setFeedback({ type: "error", message: currentValidation });
      return;
    }

    setIsSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      const payload = buildPayloadFromForm({
        form,
        businessId,
        products: safeProducts,
      });

      if (editingId) {
        await updateRecipeBook(editingId, payload);
      } else {
        await createRecipeBook(payload);
      }

      closeModal();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "No fue posible guardar la ficha tecnica.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!sheetToDeactivate?.id) {
      return;
    }

    await deactivateRecipeBook(sheetToDeactivate.id);
    setSheetToDeactivate(null);
  };

  const renderDetail = () => {
    if (!detailSheet) {
      return null;
    }

    const costing = getTechnicalSheetCosting(detailSheet);
    const yieldData = detailSheet.yield || {};
    const procedure = detailSheet.procedure || {};
    const plating = detailSheet.plating || {};
    const components = Array.isArray(detailSheet.components) ? detailSheet.components : [];

    return (
      <div className="fixed inset-0 z-[90] bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
        <div className="mx-auto flex max-h-[90vh] max-w-6xl flex-col overflow-hidden rounded-[28px] bg-slate-50 shadow-[0_30px_120px_rgba(15,23,42,0.22)]">
          <div className="border-b border-slate-200 bg-white px-6 py-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Ficha tecnica profesional
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                  {getTechnicalSheetName(detailSheet)}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {TYPE_LABELS[getTechnicalSheetType(detailSheet)]} · {detailSheet.category || "Sin categoria"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailSheet(null)}
                className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>
          </div>
          <div className="grid gap-5 overflow-y-auto p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DetailBlock title="Costo por porcion">
                <p className="text-2xl font-black text-slate-950">{formatCOP(costing.costPerPortion)}</p>
              </DetailBlock>
              <DetailBlock title="Precio venta">
                <p className="text-2xl font-black text-slate-950">{formatCOP(costing.currentSalePrice)}</p>
              </DetailBlock>
              <DetailBlock title="Food cost">
                <p className="text-2xl font-black text-slate-950">{costing.foodCostPercent.toFixed(1)}%</p>
              </DetailBlock>
              <DetailBlock title="Margen">
                <p className="text-2xl font-black text-slate-950">{costing.grossMarginPercent.toFixed(1)}%</p>
              </DetailBlock>
            </div>
            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <DetailBlock title="Datos y rendimiento">
                <dl className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div><dt className="font-semibold text-slate-900">Estado</dt><dd>{STATUS_LABELS[getTechnicalSheetStatus(detailSheet)]}</dd></div>
                  <div><dt className="font-semibold text-slate-900">Rinde</dt><dd>{yieldData.quantity || 0} {yieldData.unit || ""}</dd></div>
                  <div><dt className="font-semibold text-slate-900">Porciones</dt><dd>{yieldData.portions || 0}</dd></div>
                  <div><dt className="font-semibold text-slate-900">Conservacion</dt><dd>{yieldData.storageConditions || "Sin dato"}</dd></div>
                </dl>
              </DetailBlock>
              <DetailBlock title="Componentes">
                <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-xs uppercase tracking-[0.12em] text-slate-500">
                      <tr>
                        <th className="px-3 py-3">Componente</th>
                        <th className="px-3 py-3">Tipo</th>
                        <th className="px-3 py-3">Cantidad</th>
                        <th className="px-3 py-3">Costo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {components.map((component) => (
                        <tr key={component.id}>
                          <td className="px-3 py-3 font-medium text-slate-900">{component.name}</td>
                          <td className="px-3 py-3 text-slate-500">{component.sourceType === "technical_sheet" ? "Ficha base" : "Insumo"}</td>
                          <td className="px-3 py-3 text-slate-500">{component.quantity} {component.unit}</td>
                          <td className="px-3 py-3 font-semibold text-slate-900">{formatCOP(component.totalCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DetailBlock>
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              <DetailBlock title="Procedimiento">
                {Array.isArray(procedure.steps) && procedure.steps.length ? (
                  <ol className="grid gap-2 text-sm text-slate-600">
                    {procedure.steps.map((step) => (
                      <li key={`${step.order}-${step.description}`}>
                        <span className="font-semibold text-slate-900">{step.order}.</span> {step.description}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-slate-500">Sin procedimiento documentado.</p>
                )}
              </DetailBlock>
              <DetailBlock title="Montaje y presentacion">
                <div className="grid gap-3 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-900">Vajilla:</span> {plating.plateware || "Sin dato"}</p>
                  <p><span className="font-semibold text-slate-900">Decoracion:</span> {plating.decoration || "Sin dato"}</p>
                  <p>{plating.instructions || "Sin instrucciones de montaje."}</p>
                </div>
              </DetailBlock>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold text-slate-900">Fichas tecnicas</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Administra bases de cocina, productos finales, produccion, montaje y rentabilidad con componentes reutilizables.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={16} />
            Nueva ficha tecnica
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Total</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{recipeSummary.total}</p>
            <p className="mt-1 text-sm text-slate-500">Fichas registradas.</p>
          </article>
          <article className="rounded-[24px] bg-emerald-50 p-4 ring-1 ring-emerald-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Activas</p>
            <p className="mt-2 text-2xl font-black text-emerald-900">{recipeSummary.active}</p>
            <p className="mt-1 text-sm text-emerald-800/80">Listas para operar.</p>
          </article>
          <article className="rounded-[24px] bg-amber-50 p-4 ring-1 ring-amber-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Borradores</p>
            <p className="mt-2 text-2xl font-black text-amber-900">{recipeSummary.draft}</p>
            <p className="mt-1 text-sm text-amber-800/80">Pendientes de completar.</p>
          </article>
          <article className="rounded-[24px] bg-rose-50 p-4 ring-1 ring-rose-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700">Margen bajo</p>
            <p className="mt-2 text-2xl font-black text-rose-900">{recipeSummary.lowMargin}</p>
            <p className="mt-1 text-sm text-rose-800/80">Requieren precio o receta.</p>
          </article>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <article className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
            <p className="text-sm font-semibold text-slate-900">Riesgo por abastecimiento</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{recipeOperationalSummary.atRisk}</p>
          </article>
          <article className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
            <p className="text-sm font-semibold text-slate-900">Sin procedimiento</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{recipeOperationalSummary.undocumentedOps}</p>
          </article>
          <article className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
            <p className="text-sm font-semibold text-slate-900">Margen promedio</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{recipeOperationalSummary.averageMargin.toFixed(0)}%</p>
          </article>
        </div>
      </section>

      <section className="rounded-[28px] bg-white/85 p-5 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Buscar por nombre"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
            />
          </label>
          <select
            value={filters.type}
            onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
          >
            <option value="">Todos los tipos</option>
            {TECHNICAL_SHEET_TYPES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
          >
            <option value="">Todas las categorias</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
          >
            <option value="">Todos los estados</option>
            {TECHNICAL_SHEET_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-4">
        {filteredSheets.length > 0 ? (
          filteredSheets.map((sheet) => {
            const costing = getTechnicalSheetCosting(sheet);
            return (
              <article
                key={sheet.id}
                className="rounded-[28px] bg-white/85 p-5 shadow-lg ring-1 ring-white/70 backdrop-blur"
              >
                <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr_auto] xl:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">{getTechnicalSheetName(sheet)}</h3>
                      <StatusBadge status={getTechnicalSheetStatus(sheet)} />
                      <FinancialBadge costing={costing} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {TYPE_LABELS[getTechnicalSheetType(sheet)]} · {sheet.category || "Sin categoria"} · {(sheet.components || sheet.ingredients || []).length} componente(s)
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Costo/porcion</p>
                      <p className="mt-1 font-semibold text-slate-950">{formatCOP(costing.costPerPortion)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Precio</p>
                      <p className="mt-1 font-semibold text-slate-950">{formatCOP(costing.currentSalePrice)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Sugerido</p>
                      <p className="mt-1 font-semibold text-slate-950">{formatCOP(costing.suggestedPrice)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Food cost</p>
                      <p className="mt-1 font-semibold text-slate-950">{costing.foodCostPercent.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button type="button" onClick={() => setDetailSheet(sheet)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200" title="Ver detalle">
                      <Eye size={16} />
                    </button>
                    <button type="button" onClick={() => openEditModal(sheet)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200" title="Editar">
                      <Pencil size={16} />
                    </button>
                    <button type="button" onClick={() => duplicateSheet(sheet)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200" title="Duplicar">
                      <Copy size={16} />
                    </button>
                    <button type="button" onClick={() => setSheetToDeactivate(sheet)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100" title="Desactivar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <article className="rounded-[28px] border border-dashed border-slate-300 bg-white/75 p-8 text-center text-sm text-slate-500">
            No hay fichas tecnicas con los filtros actuales.
          </article>
        )}
      </section>

      <RecipeBookEditorModal
        open={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        editingId={editingId}
        activeModalTab={activeModalTab}
        onModalTabChange={setActiveModalTab}
        form={form}
        setForm={setForm}
        products={safeProducts}
        sourceOptions={sourceOptions}
        sourceMap={sourceMap}
        previewCosting={previewCosting}
        addComponentRow={addComponentRow}
        updateComponentRow={updateComponentRow}
        removeComponentRow={removeComponentRow}
        isUploadingImage={isUploadingImage}
        onImageUpload={handleImageUpload}
        feedbackMessage={feedback.message}
        isSaving={isSaving}
        canSaveRecipe={canSaveRecipe}
      />

      <ConfirmModal
        open={Boolean(sheetToDeactivate)}
        title="Desactivar ficha tecnica"
        description={
          sheetToDeactivate
            ? `La ficha ${getTechnicalSheetName(sheetToDeactivate)} quedara inactiva sin borrar sus datos.`
            : ""
        }
        confirmLabel="Desactivar"
        onConfirm={confirmDeactivate}
        onCancel={() => setSheetToDeactivate(null)}
      />

      {renderDetail()}
    </section>
  );
}
