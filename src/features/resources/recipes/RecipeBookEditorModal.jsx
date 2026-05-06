import { BookOpenText, Plus, Trash2, Upload, X } from "lucide-react";
import FormInput from "../../../components/FormInput";
import FormSelect from "../../../components/FormSelect";
import ModalWrapper from "../../../components/ModalWrapper";
import { formatCOP } from "../../../utils/formatters";
import {
  MENU_CLASSIFICATIONS,
  MODAL_TABS,
  TECHNICAL_SHEET_STATUSES,
  TECHNICAL_SHEET_TYPES,
  YIELD_UNITS,
} from "./recipeBookHelpers";

const LEVEL_OPTIONS = [
  { value: "", label: "Sin definir" },
  { value: "high", label: "Alta" },
  { value: "medium", label: "Media" },
  { value: "low", label: "Baja" },
];

function MetricCard({ label, value, tone = "bg-white text-slate-950 ring-slate-200" }) {
  return (
    <article className={`rounded-2xl p-4 ring-1 ${tone}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </article>
  );
}

export default function RecipeBookEditorModal({
  open,
  onClose,
  onSubmit,
  editingId,
  activeModalTab,
  onModalTabChange,
  form,
  setForm,
  products,
  sourceOptions,
  sourceMap,
  previewCosting,
  addComponentRow,
  updateComponentRow,
  removeComponentRow,
  isUploadingImage,
  onImageUpload,
  feedbackMessage,
  isSaving,
  canSaveRecipe,
}) {
  const isRecipeSubmitBlocked = isSaving || !canSaveRecipe;

  const applySourceToComponent = (index, sourceKey) => {
    const source = sourceMap[sourceKey];
    updateComponentRow(index, "sourceKey", sourceKey);

    if (!source) {
      updateComponentRow(index, "sourceId", "");
      return;
    }

    updateComponentRow(index, "sourceType", source.sourceType);
    updateComponentRow(index, "sourceId", source.id);
    updateComponentRow(index, "name", source.name);
    updateComponentRow(index, "unit", source.unit);
    updateComponentRow(index, "unitCost", String(source.unitCost || 0));
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-7xl"
      icon={{ main: <BookOpenText size={20} />, close: <X size={18} /> }}
      title={editingId ? "Editar ficha tecnica" : "Nueva ficha tecnica"}
      description="Construye fichas por niveles con rendimiento, componentes, montaje y lectura financiera."
    >
      <form onSubmit={onSubmit} className="grid gap-6">
        <div className="flex flex-wrap gap-2">
          {MODAL_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onModalTabChange(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeModalTab === tab.id
                  ? "bg-slate-950 text-white shadow-md shadow-slate-900/15"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeModalTab === "general" ? (
          <section className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormInput
                label="Nombre"
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
              <FormInput
                label="Codigo interno"
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              />
              <FormSelect
                label="Tipo de ficha"
                required
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                options={TECHNICAL_SHEET_TYPES}
              />
              <FormSelect
                label="Estado"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                options={TECHNICAL_SHEET_STATUSES}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <FormInput
                label="Categoria"
                required
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                hint="Usa la categoria existente del negocio cuando aplique."
              />
              <FormInput
                label="Responsable"
                value={form.responsible}
                onChange={(event) =>
                  setForm((current) => ({ ...current, responsible: event.target.value }))
                }
              />
              <FormSelect
                label="Producto de venta vinculado"
                value={form.productId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, productId: event.target.value }))
                }
              >
                <option value="">Sin producto vinculado</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <FormInput
              label="Descripcion"
              multiline
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </section>
        ) : null}

        {activeModalTab === "yield" ? (
          <section className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormInput
                label="Cantidad producida"
                type="number"
                min="0"
                step="0.01"
                value={form.yieldQuantity}
                onChange={(event) =>
                  setForm((current) => ({ ...current, yieldQuantity: event.target.value }))
                }
              />
              <FormSelect
                label="Unidad de rendimiento"
                value={form.yieldUnit}
                onChange={(event) =>
                  setForm((current) => ({ ...current, yieldUnit: event.target.value }))
                }
                options={YIELD_UNITS}
              />
              <FormInput
                label="Numero de porciones"
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.portions}
                onChange={(event) =>
                  setForm((current) => ({ ...current, portions: event.target.value }))
                }
              />
              <FormInput
                label="Merma"
                labelNote="%"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.wastePercent}
                onChange={(event) =>
                  setForm((current) => ({ ...current, wastePercent: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormInput
                label="Tamano de porcion"
                type="number"
                min="0"
                step="0.01"
                value={form.portionSize}
                onChange={(event) =>
                  setForm((current) => ({ ...current, portionSize: event.target.value }))
                }
              />
              <FormSelect
                label="Unidad por porcion"
                value={form.portionUnit}
                onChange={(event) =>
                  setForm((current) => ({ ...current, portionUnit: event.target.value }))
                }
                options={YIELD_UNITS}
              />
              <FormInput
                label="Rendimiento util"
                type="number"
                min="0"
                step="0.01"
                value={form.usefulYield}
                onChange={(event) =>
                  setForm((current) => ({ ...current, usefulYield: event.target.value }))
                }
                hint="Puede quedar vacio para calcularlo desde cantidad y merma."
              />
              <FormInput
                label="Vida util"
                value={form.shelfLife}
                onChange={(event) =>
                  setForm((current) => ({ ...current, shelfLife: event.target.value }))
                }
              />
            </div>
            <FormInput
              label="Condiciones de conservacion"
              multiline
              rows={3}
              value={form.storageConditions}
              onChange={(event) =>
                setForm((current) => ({ ...current, storageConditions: event.target.value }))
              }
            />
          </section>
        ) : null}

        {activeModalTab === "components" ? (
          <section className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Ingredientes y componentes</h4>
                <p className="text-sm text-slate-500">
                  Combina insumos crudos con fichas base ya registradas.
                </p>
              </div>
              <button
                type="button"
                onClick={addComponentRow}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                <Plus size={16} />
                Agregar componente
              </button>
            </div>
            <div className="grid gap-3">
              {form.components.map((component, index) => {
                const sourceKey = `${component.sourceType}:${component.sourceId}`;
                return (
                  <article
                    key={component.id}
                    className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 xl:grid-cols-[1.35fr_0.6fr_0.5fr_0.65fr_0.65fr_auto]"
                  >
                    <FormSelect
                      label={`Origen ${index + 1}`}
                      value={sourceKey}
                      onChange={(event) => applySourceToComponent(index, event.target.value)}
                    >
                      <option value="">Seleccionar origen</option>
                      {sourceOptions.map((option) => (
                        <option
                          key={`${option.sourceType}:${option.id}`}
                          value={`${option.sourceType}:${option.id}`}
                        >
                          {option.label}
                        </option>
                      ))}
                    </FormSelect>
                    <FormInput
                      label="Cantidad"
                      type="number"
                      min="0"
                      step="0.01"
                      value={component.quantity}
                      onChange={(event) => updateComponentRow(index, "quantity", event.target.value)}
                    />
                    <FormInput
                      label="Unidad"
                      value={component.unit}
                      onChange={(event) => updateComponentRow(index, "unit", event.target.value)}
                    />
                    <FormInput
                      label="Costo unitario"
                      type="number"
                      min="0"
                      step="0.01"
                      value={component.unitCost}
                      onChange={(event) => updateComponentRow(index, "unitCost", event.target.value)}
                    />
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Costo
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {formatCOP(component.totalCost)}
                      </p>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeComponentRow(index)}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <FormInput
                      label="Observaciones"
                      className="xl:col-span-6"
                      value={component.notes}
                      onChange={(event) => updateComponentRow(index, "notes", event.target.value)}
                    />
                  </article>
                );
              })}
              {form.components.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                  Agrega componentes para activar el costeo automatico.
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {activeModalTab === "procedure" ? (
          <section className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="grid gap-4 md:grid-cols-3">
              <FormInput
                label="Tiempo estimado"
                labelNote="min"
                type="number"
                min="0"
                step="1"
                value={form.estimatedTime}
                onChange={(event) =>
                  setForm((current) => ({ ...current, estimatedTime: event.target.value }))
                }
              />
              <FormInput
                label="Temperatura"
                value={form.temperature}
                onChange={(event) =>
                  setForm((current) => ({ ...current, temperature: event.target.value }))
                }
              />
              <FormInput
                label="Equipos requeridos"
                value={form.equipment}
                onChange={(event) =>
                  setForm((current) => ({ ...current, equipment: event.target.value }))
                }
              />
            </div>
            <FormInput
              label="Pasos ordenados"
              multiline
              rows={8}
              value={form.procedureSteps}
              onChange={(event) =>
                setForm((current) => ({ ...current, procedureSteps: event.target.value }))
              }
              hint="Un paso por linea."
            />
            <FormInput
              label="Observaciones de preparacion"
              multiline
              rows={3}
              value={form.procedureNotes}
              onChange={(event) =>
                setForm((current) => ({ ...current, procedureNotes: event.target.value }))
              }
            />
          </section>
        ) : null}

        {activeModalTab === "plating" ? (
          <section className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="grid gap-4 md:grid-cols-3">
              <FormInput
                label="Vajilla o empaque"
                value={form.plateware}
                onChange={(event) =>
                  setForm((current) => ({ ...current, plateware: event.target.value }))
                }
              />
              <FormInput
                label="Decoracion"
                value={form.decoration}
                onChange={(event) =>
                  setForm((current) => ({ ...current, decoration: event.target.value }))
                }
              />
              <FormInput
                label="Imagen futura / URL"
                value={form.imageUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, imageUrl: event.target.value }))
                }
              />
            </div>
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50">
              <Upload size={16} />
              {isUploadingImage ? "Subiendo imagen..." : "Subir imagen"}
              <input type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
            </label>
            <FormInput
              label="Instrucciones de emplatado"
              multiline
              rows={4}
              value={form.platingInstructions}
              onChange={(event) =>
                setForm((current) => ({ ...current, platingInstructions: event.target.value }))
              }
            />
            <FormInput
              label="Notas visuales"
              multiline
              rows={3}
              value={form.visualNotes}
              onChange={(event) =>
                setForm((current) => ({ ...current, visualNotes: event.target.value }))
              }
            />
          </section>
        ) : null}

        {activeModalTab === "costing" ? (
          <section className="grid gap-5 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormInput
                label="Precio venta actual"
                type="number"
                min="0"
                step="1"
                value={form.currentSalePrice}
                onChange={(event) =>
                  setForm((current) => ({ ...current, currentSalePrice: event.target.value }))
                }
              />
              <FormInput
                label="Food cost objetivo"
                labelNote="%"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={form.targetFoodCost}
                onChange={(event) =>
                  setForm((current) => ({ ...current, targetFoodCost: event.target.value }))
                }
              />
              <FormSelect
                label="Popularidad"
                value={form.popularity}
                onChange={(event) =>
                  setForm((current) => ({ ...current, popularity: event.target.value }))
                }
                options={LEVEL_OPTIONS}
              />
              <FormSelect
                label="Rentabilidad BI"
                value={form.profitability}
                onChange={(event) =>
                  setForm((current) => ({ ...current, profitability: event.target.value }))
                }
                options={LEVEL_OPTIONS}
              />
            </div>
            <FormSelect
              label="Clasificacion menu"
              value={form.menuClassification}
              onChange={(event) =>
                setForm((current) => ({ ...current, menuClassification: event.target.value }))
              }
              options={MENU_CLASSIFICATIONS}
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Costo total" value={formatCOP(previewCosting.totalCost)} />
              <MetricCard label="Costo por porcion" value={formatCOP(previewCosting.costPerPortion)} />
              <MetricCard
                label="Precio sugerido"
                value={formatCOP(previewCosting.suggestedPrice)}
                tone="bg-[#fff7df] text-slate-950 ring-[#d4a72c]/25"
              />
              <MetricCard label="Food cost" value={`${previewCosting.foodCostPercent.toFixed(1)}%`} />
              <MetricCard label="Margen unitario" value={formatCOP(previewCosting.grossMargin)} />
              <MetricCard label="Margen %" value={`${previewCosting.grossMarginPercent.toFixed(1)}%`} />
            </div>
          </section>
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
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Guardando..." : editingId ? "Actualizar ficha" : "Crear ficha"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
