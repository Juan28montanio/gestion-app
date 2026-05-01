import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import {
  calculateRecipeMetricsPreview,
  createRecipeBook,
  deleteRecipeBook,
  updateRecipeBook,
} from "../services/recipeBookService";
import { uploadRecipeImage } from "../services/storageService";
import ConfirmModal from "./ConfirmModal";
import { formatCOP } from "../utils/formatters";
import {
  buildRecipeForm,
  buildRecipeOperationalSummary,
  buildRecipeSummary,
  buildSupplyReferenceMap,
  createEmptyRecipeForm,
  getRecipeReadiness,
  MODAL_TABS,
} from "../features/resources/recipes/recipeBookHelpers";
import {
  getProfitabilityClasses,
  getProfitabilityLabel,
  getRecipeAction,
  getSuggestedDeltaLabel,
  isComposedRecipeMode,
} from "../features/resources/recipes/recipeCostingShared";
import RecipeBookEditorModal from "../features/resources/recipes/RecipeBookEditorModal";

function normalizeComparableValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
    () => safeProducts.filter((product) => !isComposedRecipeMode(product.recipe_mode)),
    [safeProducts]
  );
  const safeSupplies = Array.isArray(supplies) ? supplies : [];
  const safeRecipeBooks = useMemo(
    () =>
      Array.isArray(recipeBooks)
        ? recipeBooks.filter((recipeBook) => !isComposedRecipeMode(recipeBook.recipe_mode))
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

  const recipeSummary = useMemo(() => buildRecipeSummary(safeRecipeBooks), [safeRecipeBooks]);
  const recipeOperationalSummary = useMemo(
    () => buildRecipeOperationalSummary(safeRecipeBooks, safeSupplies),
    [safeRecipeBooks, safeSupplies]
  );
  const canSaveRecipe = useMemo(() => {
    const normalizedWastePct = Number(form.wastePct);
    const normalizedTargetMarginPct = Number(form.targetMarginPct);
    const normalizedPrepTimeMinutes = Number(form.prepTimeMinutes || 0);

    return (
      Boolean(form.productId) &&
      Number.isFinite(normalizedWastePct) &&
      normalizedWastePct >= 0 &&
      Number.isFinite(normalizedTargetMarginPct) &&
      normalizedTargetMarginPct >= 0 &&
      Number.isFinite(normalizedPrepTimeMinutes) &&
      normalizedPrepTimeMinutes >= 0 &&
      form.ingredients.length > 0 &&
      form.ingredients.every(
        (ingredient) => ingredient.ingredientId && Number(ingredient.quantity) > 0
      )
    );
  }, [form]);

  const recipeDuplicate = useMemo(() => {
    if (!form.productId) {
      return null;
    }

    return (
      safeRecipeBooks.find(
        (recipeBook) =>
          recipeBook.id !== editingId &&
          normalizeComparableValue(recipeBook.product_id) === normalizeComparableValue(form.productId)
      ) || null
    );
  }, [editingId, form.productId, safeRecipeBooks]);

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
    setForm({ ...createEmptyRecipeForm(), productId: focusedProductId });
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
    setForm(createEmptyRecipeForm());
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
      const normalizedWastePct = Number(form.wastePct);
      const normalizedTargetMarginPct = Number(form.targetMarginPct);
      const normalizedPrepTimeMinutes = Number(form.prepTimeMinutes || 0);
      const normalizedIngredients = form.ingredients.map((ingredient) => ({
        ingredient_id: ingredient.ingredientId,
        quantity: Number(ingredient.quantity),
      }));

      if (!selectedProduct) {
        throw new Error("Selecciona el producto antes de guardar la ficha tecnica.");
      }

      if (recipeDuplicate) {
        throw new Error(
          `Ya existe una ficha tecnica para ${recipeDuplicate.product_name || selectedProduct.name}. Edita la ficha actual en lugar de crear otra para el mismo producto.`
        );
      }

      if (!Number.isFinite(normalizedWastePct) || normalizedWastePct < 0) {
        throw new Error("La merma debe ser un numero valido mayor o igual a cero.");
      }

      if (!Number.isFinite(normalizedTargetMarginPct) || normalizedTargetMarginPct < 0) {
        throw new Error("El margen objetivo debe ser un numero valido mayor o igual a cero.");
      }

      if (!Number.isFinite(normalizedPrepTimeMinutes) || normalizedPrepTimeMinutes < 0) {
        throw new Error("El tiempo estimado debe ser un numero valido mayor o igual a cero.");
      }

      if (!normalizedIngredients.length) {
        throw new Error("Agrega al menos un insumo antes de guardar la ficha tecnica.");
      }

      if (
        normalizedIngredients.some(
          (ingredient) =>
            !ingredient.ingredient_id ||
            !Number.isFinite(ingredient.quantity) ||
            ingredient.quantity <= 0
        )
      ) {
        throw new Error(
          "Cada insumo debe tener una base seleccionada y una cantidad valida para costear la ficha."
        );
      }

      const payload = {
        business_id: businessId,
        product_id: form.productId,
        product_name: selectedProduct?.name || "",
        sale_price: Number(selectedProduct?.price || 0),
        waste_pct: normalizedWastePct,
        target_margin_pct: normalizedTargetMarginPct,
        prep_time_minutes: normalizedPrepTimeMinutes,
        plating_photo_url: form.platingPhotoUrl,
        preparation_steps: form.preparationSteps
          .split("\n")
          .map((step) => step.trim())
          .filter(Boolean),
        ingredients: normalizedIngredients,
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
            setEditingId(null);
            setActiveModalTab("costing");
            setForm(createEmptyRecipeForm());
            setFeedback({ type: "", message: "" });
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
                  {recipeBook.ingredients?.length || 0} insumos - {recipeBook.prep_time_minutes || 0} min
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                  getProfitabilityClasses(recipeBook.profitability_status)
                }`}
              >
                {getProfitabilityLabel(recipeBook.profitability_status)}
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

      <RecipeBookEditorModal
        open={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        editingId={editingId}
        activeModalTab={activeModalTab}
        onModalTabChange={setActiveModalTab}
        form={form}
        setForm={setForm}
        availableProducts={availableProducts}
        recipeReadiness={recipeReadiness}
        previewMetrics={previewMetrics}
        selectedProduct={selectedProduct}
        safeSupplies={safeSupplies}
        supplyReferenceMap={supplyReferenceMap}
        addIngredientRow={addIngredientRow}
        updateIngredientRow={updateIngredientRow}
        removeIngredientRow={removeIngredientRow}
        isUploadingImage={isUploadingImage}
        onImageUpload={handleImageUpload}
        feedbackMessage={feedback.message}
        isSaving={isSaving}
        canSaveRecipe={canSaveRecipe}
        recipeDuplicate={recipeDuplicate}
      />
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

