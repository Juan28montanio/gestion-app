import { useEffect, useMemo, useState } from "react";
import { BookOpenText, Pencil, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import {
  calculateRecipeMetricsPreview,
  createRecipeBook,
  deleteRecipeBook,
  updateRecipeBook,
} from "../services/recipeBookService";
import { uploadRecipeImage } from "../services/storageService";
import ConfirmModal from "./ConfirmModal";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import ModalWrapper from "./ModalWrapper";
import { formatCOP } from "../utils/formatters";

const EMPTY_RECIPE_FORM = {
  productId: "",
  wastePct: "0",
  targetMarginPct: "30",
  prepTimeMinutes: "",
  platingPhotoUrl: "",
  preparationSteps: "",
  ingredients: [],
};

const MODAL_TABS = [
  { id: "costing", label: "Costeo" },
  { id: "operations", label: "Operacion" },
];

const STATUS_META = {
  healthy: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-100 text-amber-700 ring-amber-200",
  critical: "bg-rose-100 text-rose-700 ring-rose-200",
};

const STATUS_LABELS = {
  healthy: "Rentable",
  warning: "Ajustar precio",
  critical: "Margen critico",
};

function getRecipeAction(recipeBook) {
  const profitabilityStatus = recipeBook?.profitability_status || "warning";

  if (profitabilityStatus === "healthy") {
    return "Mantener el precio actual y vigilar cambios de insumo.";
  }

  if (profitabilityStatus === "critical") {
    return "Subir precio o revisar cantidades y merma cuanto antes.";
  }

  return "Revisar margen objetivo y validar el costo real antes de seguir vendiendo.";
}

function getSuggestedDeltaLabel(currentPrice, suggestedPrice) {
  const current = Number(currentPrice || 0);
  const suggested = Number(suggestedPrice || 0);
  const delta = suggested - current;

  if (!current || Math.abs(delta) < 1) {
    return "El precio actual ya esta alineado.";
  }

  if (delta > 0) {
    return `Conviene subir ${formatCOP(delta)} para llegar al precio recomendado.`;
  }

  return `Hay espacio para bajar ${formatCOP(Math.abs(delta))} si quieres ganar competitividad.`;
}

function buildRecipeForm(recipeBook) {
  if (!recipeBook) {
    return EMPTY_RECIPE_FORM;
  }

  return {
    productId: recipeBook.product_id || "",
    wastePct: String(recipeBook.waste_pct ?? 0),
    targetMarginPct: String(recipeBook.target_margin_pct ?? 30),
    prepTimeMinutes: String(recipeBook.prep_time_minutes ?? ""),
    platingPhotoUrl: recipeBook.plating_photo_url || "",
    preparationSteps: Array.isArray(recipeBook.preparation_steps)
      ? recipeBook.preparation_steps.join("\n")
      : "",
    ingredients: Array.isArray(recipeBook.ingredients)
      ? recipeBook.ingredients.map((ingredient) => ({
          ingredientId: ingredient.ingredient_id || "",
          quantity: String(ingredient.quantity ?? ""),
        }))
      : [],
  };
}

function buildSupplyReferenceMap(supplies) {
  return supplies.reduce((acc, supply) => {
    acc[supply.id] = supply;
    return acc;
  }, {});
}

function getRecipeReadiness(form) {
  const hasProduct = Boolean(form.productId);
  const hasIngredients = Array.isArray(form.ingredients) && form.ingredients.length > 0;
  const hasOperations =
    Number(form.prepTimeMinutes || 0) > 0 || String(form.preparationSteps || "").trim().length > 0;

  if (hasProduct && hasIngredients && hasOperations) {
    return {
      title: "Ficha lista para operar",
      body: "Ya conecta producto, receta y una base operativa util para cocina.",
    };
  }

  if (hasProduct && hasIngredients) {
    return {
      title: "Falta documentar la operacion",
      body: "La ficha ya costea, pero todavia necesita tiempo o pasos para servir como guia.",
    };
  }

  if (hasProduct) {
    return {
      title: "Falta cargar la receta",
      body: "Seleccionaste el producto, pero aun no definiste sus insumos reales.",
    };
  }

  return {
    title: "Empieza conectando el producto",
    body: "Primero elige el plato y luego carga la receta con cantidades reales.",
  };
}

export default function RecipeBookManager({
  businessId,
  products,
  supplies,
  recipeBooks,
  focusedProductId,
  onFocusHandled,
}) {
  const [form, setForm] = useState(EMPTY_RECIPE_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("costing");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewMetrics, setPreviewMetrics] = useState({
    baseCost: 0,
    realCost: 0,
    currentMarginPct: 0,
    suggestedPrice: 0,
    profitabilityStatus: "warning",
  });
  const [recipeToDelete, setRecipeToDelete] = useState(null);
  const [highlightedRecipeId, setHighlightedRecipeId] = useState("");
  const [focusContextProductId, setFocusContextProductId] = useState("");
  const safeProducts = Array.isArray(products) ? products : [];
  const directProducts = useMemo(
    () => safeProducts.filter((product) => String(product.recipe_mode || "direct") !== "composed"),
    [safeProducts]
  );
  const safeSupplies = Array.isArray(supplies) ? supplies : [];
  const safeRecipeBooks = useMemo(
    () =>
      Array.isArray(recipeBooks)
        ? recipeBooks.filter((recipeBook) => String(recipeBook.recipe_mode || "direct") !== "composed")
        : [],
    [recipeBooks]
  );
  const supplyReferenceMap = useMemo(() => buildSupplyReferenceMap(safeSupplies), [safeSupplies]);
  const recipeReadiness = useMemo(() => getRecipeReadiness(form), [form]);

  const availableProducts = useMemo(
    () =>
      directProducts.filter(
        (product) =>
          !safeRecipeBooks.some((recipeBook) => recipeBook.product_id === product.id) ||
          safeRecipeBooks.some(
            (recipeBook) => recipeBook.product_id === product.id && recipeBook.id === editingId
          )
      ),
    [directProducts, editingId, safeRecipeBooks]
  );

  const selectedProduct = useMemo(
    () => directProducts.find((product) => product.id === form.productId),
    [directProducts, form.productId]
  );

  const recipeSummary = useMemo(() => {
    const healthy = safeRecipeBooks.filter((recipeBook) => recipeBook.profitability_status === "healthy").length;
    const warning = safeRecipeBooks.filter((recipeBook) => recipeBook.profitability_status === "warning").length;
    const critical = safeRecipeBooks.filter((recipeBook) => recipeBook.profitability_status === "critical").length;
    const incomplete = safeRecipeBooks.filter(
      (recipeBook) => !Array.isArray(recipeBook.ingredients) || recipeBook.ingredients.length === 0
    ).length;

    return { healthy, warning, critical, incomplete };
  }, [safeRecipeBooks]);
  const recipeOperationalSummary = useMemo(() => {
    const criticalSupplyIds = new Set(
      safeSupplies
        .filter((supply) => {
          const stock = Number(supply.stock || 0);
          const min = Number(supply.stock_min_alert || 0);
          return stock <= 0 || (min > 0 && stock <= min);
        })
        .map((supply) => supply.id)
    );
    const atRisk = safeRecipeBooks.filter((recipeBook) =>
      (recipeBook.ingredients || []).some((ingredient) => criticalSupplyIds.has(ingredient.ingredient_id))
    ).length;
    const undocumentedOps = safeRecipeBooks.filter(
      (recipeBook) =>
        !Array.isArray(recipeBook.preparation_steps) ||
        recipeBook.preparation_steps.length === 0 ||
        Number(recipeBook.prep_time_minutes || 0) <= 0
    ).length;
    const averagePrepMinutes = safeRecipeBooks.length
      ? safeRecipeBooks.reduce(
          (sum, recipeBook) => sum + Number(recipeBook.prep_time_minutes || 0),
          0
        ) / safeRecipeBooks.length
      : 0;

    return {
      atRisk,
      undocumentedOps,
      averagePrepMinutes,
    };
  }, [safeRecipeBooks, safeSupplies]);

  useEffect(() => {
    const metrics = calculateRecipeMetricsPreview({
      ingredients: form.ingredients.map((ingredient) => ({
        ingredient_id: ingredient.ingredientId,
        quantity: Number(ingredient.quantity),
      })),
      inventory: safeSupplies,
      wastePct: Number(form.wastePct),
      salePrice: Number(selectedProduct?.price || 0),
      targetMarginPct: Number(form.targetMarginPct),
    });

    setPreviewMetrics(metrics);
  }, [form.ingredients, form.targetMarginPct, form.wastePct, safeSupplies, selectedProduct]);

  useEffect(() => {
    if (!focusedProductId) {
      return;
    }

    const matchingRecipe = safeRecipeBooks.find((recipeBook) => recipeBook.product_id === focusedProductId);
    if (matchingRecipe) {
      setFocusContextProductId(focusedProductId);
      setHighlightedRecipeId(matchingRecipe.id);
      onFocusHandled?.();
      const timer = window.setTimeout(() => {
        setHighlightedRecipeId("");
        setFocusContextProductId("");
      }, 2400);
      return () => window.clearTimeout(timer);
    }

    setFocusContextProductId(focusedProductId);
    setEditingId(null);
    setActiveModalTab("costing");
    setForm({ ...EMPTY_RECIPE_FORM, productId: focusedProductId });
    setIsModalOpen(true);
    onFocusHandled?.();
    const timer = window.setTimeout(() => setFocusContextProductId(""), 2400);
    return () => window.clearTimeout(timer);
  }, [focusedProductId, onFocusHandled, safeRecipeBooks]);

  const addIngredientRow = () => {
    setForm((current) => ({
      ...current,
      ingredients: [...current.ingredients, { ingredientId: "", quantity: "" }],
    }));
  };

  const updateIngredientRow = (index, field, value) => {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      ),
    }));
  };

  const removeIngredientRow = (index) => {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setActiveModalTab("costing");
    setForm(EMPTY_RECIPE_FORM);
    setFeedback({ type: "", message: "" });
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

      setForm((current) => ({ ...current, platingPhotoUrl: imageUrl }));
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "No fue posible subir la imagen del plato.",
      });
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      const payload = {
        business_id: businessId,
        product_id: form.productId,
        product_name: selectedProduct?.name || "",
        sale_price: Number(selectedProduct?.price || 0),
        waste_pct: Number(form.wastePct),
        target_margin_pct: Number(form.targetMarginPct),
        prep_time_minutes: Number(form.prepTimeMinutes),
        plating_photo_url: form.platingPhotoUrl,
        preparation_steps: form.preparationSteps
          .split("\n")
          .map((step) => step.trim())
          .filter(Boolean),
        ingredients: form.ingredients.map((ingredient) => ({
          ingredient_id: ingredient.ingredientId,
          quantity: Number(ingredient.quantity),
        })),
      };

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

  const confirmDelete = async () => {
    if (!recipeToDelete) {
      return;
    }

    try {
      await deleteRecipeBook(recipeToDelete.id);
    } finally {
      setRecipeToDelete(null);
    }
  };

  return (
    <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Fichas tecnicas</h2>
          <p className="text-sm text-slate-500">
            Controla costo real, merma, tiempos y rentabilidad por plato.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveModalTab("costing");
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20"
        >
          <Plus size={16} />
          Nueva ficha
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Rentables
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">{recipeSummary.healthy}</p>
          <p className="mt-1 text-sm text-slate-500">Platos cumpliendo su margen objetivo.</p>
        </article>
        <article className="rounded-[24px] bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
            Ajustar precio
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">{recipeSummary.warning}</p>
          <p className="mt-1 text-sm text-slate-600">Platos que piden revisar precio o merma.</p>
        </article>
        <article className="rounded-[24px] bg-rose-50 p-4 ring-1 ring-rose-200">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700">
            Criticos
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">{recipeSummary.critical}</p>
          <p className="mt-1 text-sm text-slate-600">Platos por debajo del margen esperado.</p>
        </article>
        <article className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Incompletas
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">{recipeSummary.incomplete}</p>
          <p className="mt-1 text-sm text-slate-500">Fichas sin insumos cargados.</p>
        </article>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <article className="rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4">
          <p className="text-sm font-semibold text-slate-900">Recetas en riesgo por abastecimiento</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{recipeOperationalSummary.atRisk}</p>
          <p className="mt-1 text-sm text-slate-500">Cruza costeo con stock critico antes de prometer disponibilidad.</p>
        </article>
        <article className="rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4">
          <p className="text-sm font-semibold text-slate-900">Sin operacion documentada</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{recipeOperationalSummary.undocumentedOps}</p>
          <p className="mt-1 text-sm text-slate-500">Fichas que aun no sirven bien como guia de cocina.</p>
        </article>
        <article className="rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4">
          <p className="text-sm font-semibold text-slate-900">Tiempo promedio</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{recipeOperationalSummary.averagePrepMinutes.toFixed(0)} min</p>
          <p className="mt-1 text-sm text-slate-500">Ayuda a validar si la operacion real coincide con la ficha.</p>
        </article>
      </div>

      <section className="mb-6 rounded-[28px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] p-5 text-white ring-1 ring-slate-950/10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
          Lectura de rentabilidad
        </p>
        <h3 className="mt-2 text-xl font-semibold">Cada ficha debe responder si este plato se puede defender hoy.</h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Revisa precio actual, costo conectado, margen y precio recomendado para decidir si conviene mantener, ajustar o corregir la receta.
        </p>
      </section>

      {focusContextProductId ? (
        <div className="mb-6 rounded-[24px] bg-[#fff7df] px-4 py-4 ring-1 ring-[#d4a72c]/20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#946200]">
            Contexto desde productos
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            Estas revisando la ficha tecnica del producto que acabas de abrir desde el catalogo.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {safeRecipeBooks.map((recipeBook) => (
          <article
            key={recipeBook.id}
            className={`rounded-[28px] bg-slate-50 p-5 shadow-lg transition-all ${
              highlightedRecipeId === recipeBook.id
                ? "ring-2 ring-emerald-500 shadow-[0_18px_50px_rgba(16,185,129,0.18)]"
                : "ring-1 ring-slate-200"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{recipeBook.product_name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {recipeBook.ingredients?.length || 0} insumos · {recipeBook.prep_time_minutes || 0} min
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                  STATUS_META[recipeBook.profitability_status] || STATUS_META.warning
                }`}
              >
                {STATUS_LABELS[recipeBook.profitability_status] || STATUS_LABELS.warning}
              </span>
            </div>

            <div className="mt-4 rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Precio actual</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatCOP(recipeBook.sale_price || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Accion recomendada</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {getRecipeAction(recipeBook)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-[#fff7df] px-4 py-4 ring-1 ring-[#d4a72c]/20">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#946200]">Precio actual vs recomendado</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {getSuggestedDeltaLabel(recipeBook.sale_price, recipeBook.suggested_price)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#946200]">Margen objetivo</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {(Number(recipeBook.target_margin_pct || 0)).toFixed(1)}% objetivo
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Costo base</p>
                <p className="mt-2 font-semibold text-slate-900">{formatCOP(recipeBook.base_cost)}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Costo conectado</p>
                <p className="mt-2 font-semibold text-slate-900">{formatCOP(recipeBook.real_cost)}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-[#d4a72c]/20">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#946200]">
                  <Sparkles size={14} />
                  Precio recomendado
                </p>
                <p className="mt-2 font-semibold text-slate-900">{formatCOP(recipeBook.suggested_price)}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Margen actual</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {(Number(recipeBook.current_margin_pct || 0)).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setEditingId(recipeBook.id);
                  setActiveModalTab("costing");
                  setForm(buildRecipeForm(recipeBook));
                  setIsModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                <Pencil size={16} />
                Editar
              </button>
              <button
                type="button"
                onClick={() => setRecipeToDelete(recipeBook)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>

      <ModalWrapper
        open={isModalOpen}
        onClose={closeModal}
        maxWidthClass="max-w-6xl"
        icon={{ main: <BookOpenText size={20} />, close: <X size={18} /> }}
        title={editingId ? "Editar ficha tecnica" : "Nueva ficha tecnica"}
        description="Costea el plato, revisa su rentabilidad y documenta la operacion desde una sola ficha."
      >
        <form onSubmit={handleSubmit} className="grid gap-6">
          <section className="grid gap-3 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Flujo recomendado
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">1. Conecta el producto</p>
                <p className="mt-1 text-sm text-slate-500">Define merma y margen antes de discutir precio.</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">2. Carga la receta real</p>
                <p className="mt-1 text-sm text-slate-500">Usa cantidades operativas, no estimaciones bonitas.</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">3. Deja lista la ejecucion</p>
                <p className="mt-1 text-sm text-slate-500">Tiempo, imagen y pasos convierten la ficha en guia real.</p>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            {MODAL_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveModalTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeModalTab === tab.id
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-900/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeModalTab === "costing" ? (
            <>
              <section className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200 2xl:grid-cols-[1.15fr_0.85fr]">
                <div className="min-w-0 grid gap-4">
                  <div className="rounded-[20px] bg-slate-950 px-4 py-4 text-white ring-1 ring-slate-900/10">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Decision guiada
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      Ajusta merma y margen objetivo para ver si el precio actual resiste o si conviene corregirlo.
                    </p>
                  </div>

                  <FormSelect
                    label="Producto"
                    labelNote="Base"
                    className="min-w-0"
                    value={form.productId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, productId: event.target.value }))
                    }
                    hint="Selecciona el plato cuyo precio quieres contrastar con el costo real."
                  >
                    <option value="">Seleccionar producto</option>
                    {availableProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </FormSelect>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <FormInput
                      label="Merma %"
                      labelNote="Costo"
                      className="min-w-0"
                      type="number"
                      min="0"
                      step="1"
                      value={form.wastePct}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, wastePct: event.target.value }))
                      }
                    />
                    <FormInput
                      label="Margen objetivo %"
                      labelNote="Objetivo"
                      className="min-w-0"
                      type="number"
                      min="0"
                      step="1"
                      value={form.targetMarginPct}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, targetMarginPct: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <aside className="min-w-0 grid gap-4 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-inner">
                  <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Estado de la ficha
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {recipeReadiness.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {recipeReadiness.body}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Costo base</p>
                      <p className="mt-2 text-lg font-bold text-slate-950">
                        {formatCOP(previewMetrics.baseCost)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Costo conectado</p>
                      <p className="mt-2 text-lg font-bold text-slate-950">
                        {formatCOP(previewMetrics.realCost)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Margen estimado</p>
                      <p className="mt-2 text-lg font-bold text-slate-950">
                        {previewMetrics.currentMarginPct.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#fff7df] px-4 py-4 ring-1 ring-[#d4a72c]/20">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#946200]">Precio recomendado</p>
                      <p className="mt-2 text-lg font-bold text-slate-950">
                        {formatCOP(previewMetrics.suggestedPrice)}
                      </p>
                    </div>
                  </div>
                </aside>
              </section>

              <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                <article className="rounded-[24px] bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Recomendacion inmediata</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {getRecipeAction({
                      profitability_status: previewMetrics.profitabilityStatus,
                    })}
                  </p>
                </article>
                <article className="rounded-[24px] bg-[#fff7df] p-4 ring-1 ring-[#d4a72c]/20">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#946200]">Impacto en precio</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {getSuggestedDeltaLabel(
                      Number(selectedProduct?.price || 0),
                      previewMetrics.suggestedPrice
                    )}
                  </p>
                </article>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-[24px] bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Tu precio actual</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatCOP(Number(selectedProduct?.price || 0))}
                  </p>
                </article>
                <article className="rounded-[24px] bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Costo conectado</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatCOP(previewMetrics.realCost)}
                  </p>
                </article>
                <article className="rounded-[24px] bg-[#fff7df] p-4 ring-1 ring-[#d4a72c]/20">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#946200]">
                    Precio recomendado
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatCOP(previewMetrics.suggestedPrice)}
                  </p>
                </article>
                <article className="rounded-[24px] bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Estado del margen</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {STATUS_LABELS[previewMetrics.profitabilityStatus] || STATUS_LABELS.warning}
                  </p>
                </article>
              </section>

              <section className="space-y-4 rounded-[28px] bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">Receta estandar</h4>
                    <p className="text-sm text-slate-500">
                      El costo del plato se recalcula cuando cambian los insumos o cantidades.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addIngredientRow}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                  >
                    <Plus size={16} />
                    Agregar insumo
                  </button>
                </div>

                <div className="grid gap-4">
                  {form.ingredients.map((ingredient, index) => {
                    const linkedSupply = supplyReferenceMap[ingredient.ingredientId];

                    return (
                    <article
                      key={`recipe-row-${index}`}
                      className="min-w-0 rounded-[24px] bg-white p-4 ring-1 ring-slate-200"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Insumo {index + 1}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Selecciona el insumo, define la cantidad real y valida su contexto de inventario.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeIngredientRow(index)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 2xl:grid-cols-[1.05fr_0.7fr_0.95fr]">
                        <FormSelect
                          label="Insumo"
                          labelNote="Inventario"
                          className="min-w-0"
                          value={ingredient.ingredientId}
                          onChange={(event) =>
                            updateIngredientRow(index, "ingredientId", event.target.value)
                          }
                          hint="Elige un insumo ya creado para heredar costo y unidad de referencia."
                        >
                          <option value="">Seleccionar insumo</option>
                          {safeSupplies.map((supply) => (
                            <option key={supply.id} value={supply.id}>
                              {supply.name} ({supply.unit})
                            </option>
                          ))}
                        </FormSelect>

                        <FormInput
                          label="Cantidad"
                          labelNote="Receta"
                          className="min-w-0"
                          type="number"
                          min="0"
                          step="0.01"
                          value={ingredient.quantity}
                          onChange={(event) =>
                            updateIngredientRow(index, "quantity", event.target.value)
                          }
                          hint={linkedSupply ? `Unidad base: ${linkedSupply.unit || "und"}` : "Usa la unidad base del insumo."}
                        />

                        <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Referencia actual
                          </p>
                          {linkedSupply ? (
                            <div className="mt-2 grid gap-3 sm:grid-cols-2">
                              <div>
                                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Stock</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                  {Number(linkedSupply.stock || 0)} {linkedSupply.unit || "und"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">CPP</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                  {formatCOP(linkedSupply.average_cost || linkedSupply.last_purchase_cost || 0)}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-slate-500">
                              Selecciona un insumo para ver stock y costo conectado.
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  )})}

                  {form.ingredients.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-sm text-slate-500">
                      Agrega el primer insumo para empezar a costear la receta.
                    </div>
                  ) : null}
                </div>
              </section>
            </>
          ) : (
            <section className="grid gap-6">
              <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Bloque operativo
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-sm font-semibold text-slate-900">Tiempo</p>
                    <p className="mt-1 text-sm text-slate-500">Define cuanto tarda realmente el plato.</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-sm font-semibold text-slate-900">Imagen</p>
                    <p className="mt-1 text-sm text-slate-500">Aporta referencia visual para servicio y estandar.</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-sm font-semibold text-slate-900">Pasos</p>
                    <p className="mt-1 text-sm text-slate-500">Deja una secuencia util para ejecutar, no solo recordar.</p>
                  </div>
                </div>
              </section>

              <div className="grid gap-4 2xl:grid-cols-[0.75fr_1.25fr]">
                <section className="min-w-0 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
                  <FormInput
                    label="Tiempo estimado (min)"
                    labelNote="Servicio"
                    className="min-w-0"
                    type="number"
                    min="0"
                    step="1"
                    value={form.prepTimeMinutes}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, prepTimeMinutes: event.target.value }))
                    }
                    hint="Usa el tiempo promedio real, no el ideal."
                  />
                </section>

                <section className="min-w-0 grid gap-3 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
                  <FormInput
                    label="Imagen del plato (URL)"
                    labelNote="Visual"
                    className="min-w-0"
                    value={form.platingPhotoUrl}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, platingPhotoUrl: event.target.value }))
                    }
                    hint="Tambien puedes subir una imagen y SmartProfit llenara la URL automaticamente."
                  />
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50">
                    <Upload size={16} />
                    {isUploadingImage ? "Subiendo imagen..." : "Subir a Firebase Storage"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </section>
              </div>

              <section className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
                <FormInput
                  label="Pasos de preparacion"
                  labelNote="Operacion"
                  className="min-w-0"
                  multiline
                  rows={10}
                  value={form.preparationSteps}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, preparationSteps: event.target.value }))
                  }
                  hint="Separa los pasos por linea para que SmartProfit los guarde como una secuencia operativa."
                />
              </section>

              {form.platingPhotoUrl ? (
                <div className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-slate-700">Vista previa</p>
                  <img
                    src={form.platingPhotoUrl}
                    alt="Foto del plato"
                    className="mt-3 h-56 w-full rounded-[20px] object-cover"
                  />
                </div>
              ) : null}
            </section>
          )}

          {feedback.message ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
              {feedback.message}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Guardando..." : editingId ? "Actualizar ficha" : "Crear ficha"}
            </button>
          </div>
        </form>
      </ModalWrapper>

      <ConfirmModal
        open={Boolean(recipeToDelete)}
        title="Eliminar ficha tecnica"
        description={
          recipeToDelete
            ? `Se eliminara la ficha tecnica de ${recipeToDelete.product_name}.`
            : ""
        }
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setRecipeToDelete(null)}
      />
    </section>
  );
}
