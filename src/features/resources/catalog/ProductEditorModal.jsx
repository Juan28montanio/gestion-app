import { PackagePlus, Plus, Sparkles, Trash2, X } from "lucide-react";
import ModalWrapper from "../../../components/ModalWrapper";
import FormInput from "../../../components/FormInput";
import FormSelect from "../../../components/FormSelect";
import { formatCOP } from "../../../utils/formatters";

export default function ProductEditorModal({
  open,
  onClose,
  onSubmit,
  editingProductId,
  isSaving,
  canSaveProduct,
  productDuplicates,
  productForm,
  setProductForm,
  productCategories,
  productModalMetrics,
  preparationOptions,
  preparationMap,
  addPreparationRow,
  updatePreparationRow,
  removePreparationRow,
  onOpenPreparations,
  onOpenRecipe,
  feedbackMessage,
  isCatalogMode,
  currentProductRecipe,
}) {
  const isProductSubmitBlocked =
    isSaving || !canSaveProduct || Boolean(productDuplicates?.exactMatch);

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-5xl"
      icon={{ main: <PackagePlus size={20} />, close: <X size={18} /> }}
      title={editingProductId ? "Editar producto" : "Nuevo producto"}
      description="Gestiona el catalogo comercial con precios claros, categoria reutilizable y una lectura inmediata del costeo conectado."
    >
      <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-6">
          <div className="grid gap-3 rounded-[24px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] p-5 text-white ring-1 ring-slate-950/10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              Alta de producto
            </p>
            <h3 className="text-lg font-semibold">
              Define primero lo que vendes y deja que el sistema te ayude a defender el precio.
            </h3>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
                Editable: nombre, categoria, precio y stock
              </span>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-emerald-200">
                Calculado: costo conectado
              </span>
              <span className="rounded-full bg-amber-400/10 px-3 py-1 text-amber-200">
                Recomendado: precio sugerido
              </span>
            </div>
          </div>

          <div className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Nombre"
                required
                value={productForm.name}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, name: event.target.value }))
                }
              />
              <FormInput
                label="Categoria"
                required
                list="product-category-options"
                value={productForm.category}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, category: event.target.value }))
                }
                hint="Selecciona una categoria existente o crea una nueva."
              />
            </div>

            <datalist id="product-category-options">
              {productCategories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>

            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Tu precio actual"
                type="number"
                min="0"
                step="1"
                value={productForm.price}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, price: event.target.value }))
                }
              />
              <FormInput
                label="Precio recomendado"
                value={formatCOP(productModalMetrics.suggestedPrice || 0)}
                readOnly
                hint="Se calcula desde la ficha tecnica y el margen objetivo."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Stock comercial"
                type="number"
                min="0"
                step="1"
                value={productForm.stock}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, stock: event.target.value }))
                }
              />
              <div className="grid content-end">
                <button
                  type="button"
                  onClick={() =>
                    setProductForm((current) => ({
                      ...current,
                      price: String(Math.round(productModalMetrics.suggestedPrice || 0)),
                    }))
                  }
                  disabled={!productModalMetrics.suggestedPrice}
                  className="rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Usar precio sugerido
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormSelect
                label="Tipo de producto"
                value={productForm.productType}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, productType: event.target.value }))
                }
                options={[
                  { value: "standard", label: "Producto normal" },
                  { value: "ticket_wallet", label: "Tiquetera prepaga" },
                ]}
              />
              <FormInput
                label="Tickets que otorga"
                type="number"
                min="0"
                step="1"
                value={productForm.ticketUnits}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, ticketUnits: event.target.value }))
                }
                readOnly={productForm.productType !== "ticket_wallet"}
              />
              <FormInput
                label="Vigencia (dias)"
                type="number"
                min="1"
                step="1"
                value={productForm.ticketValidityDays}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    ticketValidityDays: event.target.value,
                  }))
                }
                readOnly={productForm.productType !== "ticket_wallet"}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormSelect
                label="Modo de costeo"
                labelNote="Flujo"
                value={productForm.recipeMode}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    recipeMode: event.target.value,
                    preparationItems:
                      event.target.value === "composed" ? current.preparationItems : [],
                  }))
                }
                options={[
                  { value: "direct", label: "Ficha tecnica directa" },
                  { value: "composed", label: "Producto compuesto por preparaciones" },
                ]}
                hint="Usa ficha directa para productos simples y preparaciones para platos armados."
              />
              <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-800">
                  {productForm.recipeMode === "composed"
                    ? "Este producto tomara su costo desde preparaciones base."
                    : "Este producto seguira usando una ficha tecnica editable por insumos."}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {productForm.recipeMode === "composed"
                    ? "Ideal para almuerzos, combos o platos que mezclan varias bases ya preparadas."
                    : "Ideal para productos simples como galletas, bebidas directas o recetas sin armado compuesto."}
                </p>
              </div>
            </div>

            {productForm.recipeMode === "composed" ? (
              <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">
                      Preparaciones que componen el producto
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Define cuantas porciones o unidades de cada preparacion usa este plato.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={addPreparationRow}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Agregar preparacion
                    </button>
                    <button
                      type="button"
                      onClick={onOpenPreparations}
                      className="rounded-2xl border border-[#d4a72c]/30 bg-[#fff7df] px-4 py-2 text-sm font-semibold text-[#946200] transition hover:brightness-95"
                    >
                      Ir a preparaciones base
                    </button>
                  </div>
                </div>

                <div className="grid gap-3">
                  {productForm.preparationItems.length > 0 ? (
                    productForm.preparationItems.map((item, index) => {
                      const linkedPreparation = preparationMap[item.preparationId];

                      return (
                        <div
                          key={`product-preparation-${index}`}
                          className="grid gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 lg:grid-cols-[minmax(0,1.6fr)_minmax(160px,0.8fr)_auto]"
                        >
                          <FormSelect
                            label={`Preparacion ${index + 1}`}
                            labelNote="Base"
                            value={item.preparationId}
                            onChange={(event) =>
                              updatePreparationRow(index, "preparationId", event.target.value)
                            }
                            className="min-w-0"
                          >
                            <option value="">Seleccionar preparacion</option>
                            {preparationOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </FormSelect>
                          <FormInput
                            label="Cantidad usada"
                            labelNote={linkedPreparation?.output_unit || "porcion"}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(event) =>
                              updatePreparationRow(index, "quantity", event.target.value)
                            }
                            className="min-w-0"
                          />
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removePreparationRow(index)}
                              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      Agrega las preparaciones base que componen este producto.
                    </div>
                  )}
                </div>
              </section>
            ) : null}

            <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
              <label className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
                <div>
                  <span>Permite pago con ticket</span>
                  <p className="mt-1 text-xs text-slate-400">
                    Ideal para almuerzos o planes que el cliente puede redimir desde su monedero.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={productForm.ticketEligible}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      ticketEligible: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>

          {productDuplicates?.nameMatches?.length > 0 && !productDuplicates?.exactMatch ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
              Ya existe {productDuplicates.nameMatches.length === 1 ? "un producto con este nombre" : `${productDuplicates.nameMatches.length} productos con este nombre`}. Si es otro item distinto, cambia la categoria o define mejor el contexto para que POS y fichas no queden ambiguos.
            </div>
          ) : null}

          {productDuplicates?.exactMatch ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
              Este producto parece duplicado de un registro existente. Revisa nombre, categoria y tipo de producto antes de guardar.
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
              disabled={isProductSubmitBlocked}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Guardando..." : editingProductId ? "Actualizar producto" : "Crear producto"}
            </button>
          </div>
        </div>

        <aside className="grid gap-4 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-5 shadow-inner">
          <div className="rounded-[24px] border border-slate-200 bg-white/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Ficha tecnica
            </p>
            <h4 className="mt-3 text-lg font-semibold text-slate-900">
              {currentProductRecipe
                ? productForm.recipeMode === "composed"
                  ? "Costeo compuesto enlazado"
                  : "Costeo enlazado"
                : "Aun sin costeo"}
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {currentProductRecipe
                ? productForm.recipeMode === "composed"
                  ? "Este panel se alimenta desde las preparaciones conectadas y recalcula costo, margen y precio sugerido."
                  : "Este panel se alimenta automaticamente desde la receta estandar y el costo vigente de insumos."
                : "Conecta este producto con una ficha tecnica o con preparaciones para medir costo real, margen y precio recomendado."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Costo conectado</p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {formatCOP(productModalMetrics.realCost)}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Margen estimado</p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {productModalMetrics.currentMarginPct.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/75 p-5">
            {currentProductRecipe ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-800">
                  {productForm.recipeMode === "composed"
                    ? `${productModalMetrics.preparationCount} preparacion(es) y ${productModalMetrics.ingredientsCount} insumo(s) derivados`
                    : `${productModalMetrics.ingredientsCount} insumos conectados`}
                </p>
                <p className="text-sm text-slate-500">
                  {productForm.recipeMode === "composed"
                    ? "El precio sugerido responde a la suma de preparaciones base y al margen objetivo activo."
                    : "El precio sugerido responde al margen objetivo configurado en la ficha."}
                </p>
                {!isCatalogMode ? (
                  productForm.recipeMode === "composed" ? (
                    <button
                      type="button"
                      onClick={onOpenPreparations}
                      className="inline-flex rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Abrir preparaciones
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onOpenRecipe}
                      className="inline-flex rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Abrir ficha tecnica
                    </button>
                  )
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <button
                  type="button"
                  onClick={onOpenRecipe}
                  disabled={isCatalogMode}
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={22} />
                </button>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {productForm.recipeMode === "composed"
                      ? "Conecta preparaciones base"
                      : "Agrega una ficha tecnica"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {isCatalogMode
                      ? "Crea la receta desde Centro de Recursos para activar costos y rentabilidad."
                      : productForm.recipeMode === "composed"
                        ? "Compone el producto con preparaciones ya costeadas para calcular su rentabilidad."
                        : "Enlaza receta, merma y margen objetivo desde el modulo de fichas tecnicas."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </form>
    </ModalWrapper>
  );
}
