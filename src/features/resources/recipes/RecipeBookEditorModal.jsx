import { BookOpenText, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import FormInput from "../../../components/FormInput";
import FormSelect from "../../../components/FormSelect";
import ModalWrapper from "../../../components/ModalWrapper";
import { formatCOP } from "../../../utils/formatters";
import { MODAL_TABS } from "./recipeBookHelpers";
import {
  getProfitabilityLabel,
  getRecipeAction,
  getSuggestedDeltaLabel,
} from "./recipeCostingShared";

export default function RecipeBookEditorModal({
  open,
  onClose,
  onSubmit,
  editingId,
  activeModalTab,
  onModalTabChange,
  form,
  setForm,
  availableProducts,
  recipeReadiness,
  previewMetrics,
  selectedProduct,
  safeSupplies,
  supplyReferenceMap,
  addIngredientRow,
  updateIngredientRow,
  removeIngredientRow,
  isUploadingImage,
  onImageUpload,
  feedbackMessage,
  isSaving,
  canSaveRecipe,
  recipeDuplicate,
}) {
  const isRecipeSubmitBlocked = isSaving || !canSaveRecipe || Boolean(recipeDuplicate);

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-6xl"
      icon={{ main: <BookOpenText size={20} />, close: <X size={18} /> }}
      title={editingId ? "Editar ficha tecnica" : "Nueva ficha tecnica"}
      description="Costea el plato, revisa su rentabilidad y documenta la operacion desde una sola ficha."
    >
      <form onSubmit={onSubmit} className="grid gap-6">
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
              onClick={() => onModalTabChange(tab.id)}
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
                  {getProfitabilityLabel(previewMetrics.profitabilityStatus)}
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
                  );
                })}

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
                  <input type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
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

        {recipeDuplicate ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
            Este producto ya tiene una ficha tecnica registrada. Abre la ficha existente y actualizala para no fragmentar el costeo.
          </div>
        ) : null}

        {feedbackMessage ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
            {feedbackMessage}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isRecipeSubmitBlocked}
            className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Guardando..." : editingId ? "Actualizar ficha" : "Crear ficha"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
