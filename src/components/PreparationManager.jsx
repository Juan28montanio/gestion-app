import { useMemo, useState } from "react";
import { BookOpenText, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  calculatePreparationMetricsPreview,
  createPreparation,
  deletePreparation,
  updatePreparation,
} from "../services/preparationService";
import ConfirmModal from "./ConfirmModal";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import ModalWrapper from "./ModalWrapper";
import { formatCOP } from "../utils/formatters";

const EMPTY_FORM = {
  name: "",
  category: "",
  outputUnit: "porcion",
  yieldQuantity: "1",
  wastePct: "0",
  prepTimeMinutes: "",
  preparationSteps: "",
  ingredients: [],
};

const OUTPUT_UNITS = [
  { value: "porcion", label: "Porcion" },
  { value: "g", label: "Gramos" },
  { value: "ml", label: "Mililitros" },
  { value: "und", label: "Unidades" },
  { value: "bandeja", label: "Bandeja" },
  { value: "olla", label: "Olla" },
];

const READINESS_META = {
  ready: {
    label: "Lista",
    classes: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  },
  in_progress: {
    label: "En ajuste",
    classes: "bg-amber-100 text-amber-700 ring-amber-200",
  },
  draft: {
    label: "Borrador",
    classes: "bg-slate-100 text-slate-600 ring-slate-200",
  },
};

function buildPreparationForm(preparation) {
  if (!preparation) {
    return EMPTY_FORM;
  }

  return {
    name: preparation.name || "",
    category: preparation.category || "",
    outputUnit: preparation.output_unit || "porcion",
    yieldQuantity: String(preparation.yield_quantity ?? 1),
    wastePct: String(preparation.waste_pct ?? 0),
    prepTimeMinutes: String(preparation.prep_time_minutes ?? ""),
    preparationSteps: Array.isArray(preparation.preparation_steps)
      ? preparation.preparation_steps.join("\n")
      : "",
    ingredients: Array.isArray(preparation.ingredients)
      ? preparation.ingredients.map((ingredient) => ({
          ingredientId: ingredient.ingredient_id || "",
          quantity: String(ingredient.quantity ?? ""),
        }))
      : [],
  };
}

export default function PreparationManager({ businessId, supplies, preparations }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [preparationToDelete, setPreparationToDelete] = useState(null);
  const safeSupplies = Array.isArray(supplies) ? supplies : [];
  const safePreparations = Array.isArray(preparations) ? preparations : [];

  const previewMetrics = useMemo(
    () =>
      calculatePreparationMetricsPreview({
        ingredients: form.ingredients.map((ingredient) => ({
          ingredient_id: ingredient.ingredientId,
          quantity: Number(ingredient.quantity),
        })),
        inventory: safeSupplies,
        wastePct: Number(form.wastePct),
        yieldQuantity: Number(form.yieldQuantity),
      }),
    [form.ingredients, form.wastePct, form.yieldQuantity, safeSupplies]
  );

  const preparationSummary = useMemo(() => {
    return safePreparations.reduce(
      (summary, preparation) => {
        const status = preparation.readiness_status || "draft";
        summary.total += 1;
        summary[status] += 1;
        return summary;
      },
      { total: 0, ready: 0, in_progress: 0, draft: 0 }
    );
  }, [safePreparations]);

  const supplyOptions = useMemo(
    () =>
      safeSupplies.map((supply) => ({
        value: supply.id,
        label: `${supply.name} · ${supply.unit || "und"}`,
      })),
    [safeSupplies]
  );

  const supplyMap = useMemo(
    () =>
      safeSupplies.reduce((acc, supply) => {
        acc[supply.id] = supply;
        return acc;
      }, {}),
    [safeSupplies]
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFeedback({ type: "", message: "" });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFeedback({ type: "", message: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (preparation) => {
    setEditingId(preparation.id);
    setForm(buildPreparationForm(preparation));
    setFeedback({ type: "", message: "" });
    setIsModalOpen(true);
  };

  const addIngredientRow = () => {
    setForm((current) => ({
      ...current,
      ingredients: [...current.ingredients, { ingredientId: "", quantity: "" }],
    }));
  };

  const updateIngredientRow = (index, field, value) => {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, [field]: value } : ingredient
      ),
    }));
  };

  const removeIngredientRow = (index) => {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback({ type: "", message: "" });

    const payload = {
      business_id: businessId,
      name: form.name,
      category: form.category,
      output_unit: form.outputUnit,
      yield_quantity: Number(form.yieldQuantity),
      waste_pct: Number(form.wastePct),
      prep_time_minutes: Number(form.prepTimeMinutes || 0),
      preparationSteps: form.preparationSteps,
      ingredients: form.ingredients.map((ingredient) => ({
        ingredient_id: ingredient.ingredientId,
        quantity: Number(ingredient.quantity),
      })),
    };

    try {
      if (editingId) {
        await updatePreparation(editingId, payload);
      } else {
        await createPreparation(payload);
      }

      closeModal();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "No fue posible guardar la preparacion.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!preparationToDelete?.id) {
      return;
    }

    await deletePreparation(preparationToDelete.id);
    setPreparationToDelete(null);
  };

  return (
    <section className="space-y-6">
      <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold text-slate-900">Preparaciones base</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Separa recetas de cocina de los productos de venta. Aqui defines bases como arroz,
              frijoles, salsas o jugos para preparar luego platos compuestos sin mezclar todo en
              una sola ficha.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={16} />
            Nueva preparacion
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <article className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Total
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">{preparationSummary.total}</p>
            <p className="mt-1 text-sm text-slate-500">Preparaciones registradas para cocina.</p>
          </article>
          <article className="rounded-[24px] bg-emerald-50 p-4 ring-1 ring-emerald-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Listas
            </p>
            <p className="mt-2 text-2xl font-black text-emerald-900">{preparationSummary.ready}</p>
            <p className="mt-1 text-sm text-emerald-800/80">
              Ya documentan insumos y operacion.
            </p>
          </article>
          <article className="rounded-[24px] bg-amber-50 p-4 ring-1 ring-amber-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
              En ajuste
            </p>
            <p className="mt-2 text-2xl font-black text-amber-900">
              {preparationSummary.in_progress}
            </p>
            <p className="mt-1 text-sm text-amber-800/80">
              Tienen base parcial y conviene completarlas.
            </p>
          </article>
          <article className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Borradores
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">{preparationSummary.draft}</p>
            <p className="mt-1 text-sm text-slate-500">
              Aun no tienen suficiente informacion para operar.
            </p>
          </article>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {safePreparations.length > 0 ? (
          safePreparations.map((preparation) => {
            const readiness = READINESS_META[preparation.readiness_status] || READINESS_META.draft;
            const ingredientCount = Array.isArray(preparation.ingredients)
              ? preparation.ingredients.length
              : 0;

            return (
              <article
                key={preparation.id}
                className="rounded-[28px] bg-white/85 p-5 shadow-lg ring-1 ring-white/70 backdrop-blur"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-950">{preparation.name}</h3>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${readiness.classes}`}
                      >
                        {readiness.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {preparation.category || "Sin categoria"} · rinde{" "}
                      {Number(preparation.yield_quantity || 0)} {preparation.output_unit || "porcion"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(preparation)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreparationToDelete(preparation)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Insumos
                    </p>
                    <p className="mt-2 text-xl font-black text-slate-950">{ingredientCount}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Costo total
                    </p>
                    <p className="mt-2 text-xl font-black text-slate-950">
                      {formatCOP(Number(preparation.real_cost || 0))}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#fff7df] px-4 py-3 ring-1 ring-[#d4a72c]/25">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#946200]">
                      Costo por salida
                    </p>
                    <p className="mt-2 text-xl font-black text-slate-950">
                      {formatCOP(Number(preparation.cost_per_output_unit || 0))}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(preparation.ingredients || []).slice(0, 4).map((ingredient) => {
                    const supply = supplyMap[ingredient.ingredient_id];
                    return (
                      <span
                        key={`${preparation.id}-${ingredient.ingredient_id}`}
                        className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                      >
                        {supply?.name || "Insumo"} · {Number(ingredient.quantity || 0)}{" "}
                        {supply?.unit || ""}
                      </span>
                    );
                  })}
                  {ingredientCount > 4 ? (
                    <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                      +{ingredientCount - 4} mas
                    </span>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <article className="rounded-[28px] border border-dashed border-slate-300 bg-white/75 p-8 text-center text-sm text-slate-500 xl:col-span-2">
            Crea preparaciones base para separar cocina, costeo y armado de productos compuestos.
          </article>
        )}
      </section>

      <ModalWrapper
        open={isModalOpen}
        onClose={closeModal}
        maxWidthClass="max-w-5xl"
        icon={{ main: <BookOpenText size={20} />, close: <X size={18} /> }}
        title={editingId ? "Editar preparacion" : "Nueva preparacion"}
        description="Documenta una base de cocina con rendimiento, merma e insumos para preparar luego platos compuestos con mejor control."
      >
        <form onSubmit={handleSubmit} className="grid gap-6">
          <section className="grid gap-3 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Flujo recomendado
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">1. Define la base</p>
                <p className="mt-1 text-sm text-slate-500">
                  Registra la preparacion como la entiende cocina: arroz, salsa o guiso.
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">2. Carga rendimiento real</p>
                <p className="mt-1 text-sm text-slate-500">
                  El costo por porcion depende del total producido y la merma.
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">3. Deja pasos utiles</p>
                <p className="mt-1 text-sm text-slate-500">
                  Asi la misma ficha sirve para entrenar y para costear.
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormInput
              label="Nombre"
              labelNote="Base"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              hint="Usa el nombre real de cocina para evitar duplicados."
            />
            <FormInput
              label="Categoria"
              labelNote="Orden"
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value }))
              }
              hint="Ejemplo: guarniciones, salsas, bebidas, proteinas."
            />
            <FormSelect
              label="Unidad de salida"
              labelNote="Rinde en"
              value={form.outputUnit}
              onChange={(event) =>
                setForm((current) => ({ ...current, outputUnit: event.target.value }))
              }
              options={OUTPUT_UNITS}
            />
            <FormInput
              label="Rendimiento"
              labelNote="Cantidad"
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.yieldQuantity}
              onChange={(event) =>
                setForm((current) => ({ ...current, yieldQuantity: event.target.value }))
              }
              hint="Cantidad total que produce esta preparacion."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormInput
              label="Merma"
              labelNote="%"
              type="number"
              min="0"
              max="99"
              step="0.01"
              value={form.wastePct}
              onChange={(event) =>
                setForm((current) => ({ ...current, wastePct: event.target.value }))
              }
            />
            <FormInput
              label="Tiempo"
              labelNote="Min"
              type="number"
              min="0"
              step="1"
              value={form.prepTimeMinutes}
              onChange={(event) =>
                setForm((current) => ({ ...current, prepTimeMinutes: event.target.value }))
              }
            />
            <article className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Costo total
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {formatCOP(previewMetrics.realCost)}
              </p>
              <p className="mt-1 text-sm text-slate-500">Incluye merma proyectada.</p>
            </article>
            <article className="rounded-[24px] bg-[#fff7df] p-4 ring-1 ring-[#d4a72c]/25">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#946200]">
                Costo por salida
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {formatCOP(previewMetrics.costPerOutputUnit)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Base para integrar luego platos compuestos.
              </p>
            </article>
          </div>

          <FormInput
            label="Pasos de preparacion"
            labelNote="Operacion"
            multiline
            rows={5}
            value={form.preparationSteps}
            onChange={(event) =>
              setForm((current) => ({ ...current, preparationSteps: event.target.value }))
            }
            hint="Un paso por linea. Deja una guia clara para cocina."
          />

          <section className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Insumos de la preparacion</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Usa las cantidades reales cargadas en cocina para que el costo responda bien.
                </p>
              </div>
              <button
                type="button"
                onClick={addIngredientRow}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Plus size={15} />
                Agregar insumo
              </button>
            </div>

            <div className="grid gap-3">
              {form.ingredients.length > 0 ? (
                form.ingredients.map((ingredient, index) => {
                  const linkedSupply = supplyMap[ingredient.ingredientId];

                  return (
                    <div
                      key={`preparation-ingredient-${index}`}
                      className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 lg:grid-cols-[minmax(0,1.6fr)_minmax(140px,0.8fr)_auto]"
                    >
                      <FormSelect
                        label={`Insumo ${index + 1}`}
                        labelNote="Base"
                        value={ingredient.ingredientId}
                        onChange={(event) =>
                          updateIngredientRow(index, "ingredientId", event.target.value)
                        }
                        className="min-w-0"
                      >
                        <option value="">Seleccionar insumo</option>
                        {supplyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </FormSelect>
                      <FormInput
                        label="Cantidad"
                        labelNote={linkedSupply?.unit || "unidad"}
                        type="number"
                        min="0"
                        step="0.01"
                        value={ingredient.quantity}
                        onChange={(event) =>
                          updateIngredientRow(index, "quantity", event.target.value)
                        }
                        className="min-w-0"
                      />
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeIngredientRow(index)}
                          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                  Agrega los insumos base que componen esta preparacion.
                </div>
              )}
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
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Guardando..." : editingId ? "Actualizar" : "Crear preparacion"}
            </button>
          </div>
        </form>
      </ModalWrapper>

      <ConfirmModal
        open={Boolean(preparationToDelete)}
        title="Eliminar preparacion"
        description={
          preparationToDelete
            ? `Se eliminara ${preparationToDelete.name} del libro base de cocina.`
            : ""
        }
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setPreparationToDelete(null)}
      />
    </section>
  );
}
