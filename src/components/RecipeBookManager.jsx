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

export default function RecipeBookManager({
  businessId,
  products,
  supplies,
  recipeBooks,
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

  const availableProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          !recipeBooks.some((recipeBook) => recipeBook.product_id === product.id) ||
          recipeBooks.some(
            (recipeBook) => recipeBook.product_id === product.id && recipeBook.id === editingId
          )
      ),
    [editingId, products, recipeBooks]
  );

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === form.productId),
    [form.productId, products]
  );

  useEffect(() => {
    const metrics = calculateRecipeMetricsPreview({
      ingredients: form.ingredients.map((ingredient) => ({
        ingredient_id: ingredient.ingredientId,
        quantity: Number(ingredient.quantity),
      })),
      inventory: supplies,
      wastePct: Number(form.wastePct),
      salePrice: Number(selectedProduct?.price || 0),
      targetMarginPct: Number(form.targetMarginPct),
    });

    setPreviewMetrics(metrics);
  }, [form.ingredients, form.targetMarginPct, form.wastePct, selectedProduct, supplies]);

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
            Controla costo real, merma, tiempos y semaforo de rentabilidad por plato.
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

      <div className="grid gap-4 xl:grid-cols-2">
        {recipeBooks.map((recipeBook) => (
          <article
            key={recipeBook.id}
            className="rounded-[28px] bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200"
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
                {recipeBook.profitability_status === "healthy"
                  ? "Margen saludable"
                  : recipeBook.profitability_status === "critical"
                    ? "Margen critico"
                    : "Margen ajustado"}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Costo base</p>
                <p className="mt-2 font-semibold text-slate-900">{formatCOP(recipeBook.base_cost)}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Costo real</p>
                <p className="mt-2 font-semibold text-slate-900">{formatCOP(recipeBook.real_cost)}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-[#d4a72c]/20">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#946200]">
                  <Sparkles size={14} />
                  Sugerido
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
        description="Usa una estructura por pestañas para costear, documentar la operacion y mantener toda la informacion visible."
      >
        <form onSubmit={handleSubmit} className="grid gap-6">
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
              <section className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="grid gap-4">
                  <FormSelect
                    label="Producto"
                    value={form.productId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, productId: event.target.value }))
                    }
                  >
                    <option value="">Seleccionar producto</option>
                    {availableProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </FormSelect>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormInput
                      label="Merma %"
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

                <div className="grid gap-4 md:grid-cols-2">
                  <FormInput
                    label="Costo base"
                    value={formatCOP(previewMetrics.baseCost)}
                    readOnly
                  />
                  <FormInput
                    label="Costo real"
                    value={formatCOP(previewMetrics.realCost)}
                    readOnly
                  />
                  <FormInput
                    label="Margen actual"
                    value={`${previewMetrics.currentMarginPct.toFixed(1)}%`}
                    readOnly
                  />
                  <FormInput
                    label="Precio sugerido"
                    value={formatCOP(previewMetrics.suggestedPrice)}
                    readOnly
                  />
                </div>
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

                <div className="grid gap-3">
                  {form.ingredients.map((ingredient, index) => (
                    <div
                      key={`recipe-row-${index}`}
                      className="grid gap-3 rounded-[24px] bg-white p-4 ring-1 ring-slate-200 md:grid-cols-[1.25fr_0.7fr_auto]"
                    >
                      <FormSelect
                        label="Insumo"
                        value={ingredient.ingredientId}
                        onChange={(event) =>
                          updateIngredientRow(index, "ingredientId", event.target.value)
                        }
                      >
                        <option value="">Seleccionar insumo</option>
                        {supplies.map((supply) => (
                          <option key={supply.id} value={supply.id}>
                            {supply.name} ({supply.unit})
                          </option>
                        ))}
                      </FormSelect>

                      <FormInput
                        label="Cantidad"
                        type="number"
                        min="0"
                        step="0.01"
                        value={ingredient.quantity}
                        onChange={(event) =>
                          updateIngredientRow(index, "quantity", event.target.value)
                        }
                      />

                      <button
                        type="button"
                        onClick={() => removeIngredientRow(index)}
                        className="mt-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

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
              <div className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200 xl:grid-cols-[0.75fr_1.25fr]">
                <FormInput
                  label="Tiempo estimado (min)"
                  type="number"
                  min="0"
                  step="1"
                  value={form.prepTimeMinutes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, prepTimeMinutes: event.target.value }))
                  }
                />

                <div className="grid gap-3">
                  <FormInput
                    label="Imagen del plato (URL)"
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
                </div>
              </div>

              <FormInput
                label="Pasos de preparacion"
                multiline
                rows={10}
                value={form.preparationSteps}
                onChange={(event) =>
                  setForm((current) => ({ ...current, preparationSteps: event.target.value }))
                }
                hint="Separa los pasos por linea para que SmartProfit los guarde como una secuencia operativa."
              />

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
