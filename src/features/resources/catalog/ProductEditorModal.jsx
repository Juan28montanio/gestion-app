import { PackagePlus, Plus, Sparkles, X } from "lucide-react";
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
                ? "Costeo enlazado"
                : "Aun sin costeo"}
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {currentProductRecipe
                ? "Este panel se alimenta automaticamente desde la ficha tecnica y el costo vigente de insumos."
                : "Conecta este producto con una ficha tecnica para medir costo real, margen y precio recomendado."}
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
                  {`${productModalMetrics.ingredientsCount} insumos conectados`}
                </p>
                <p className="text-sm text-slate-500">
                  El precio sugerido responde al margen objetivo configurado en la ficha.
                </p>
                {!isCatalogMode ? (
                  <button
                    type="button"
                    onClick={onOpenRecipe}
                    className="inline-flex rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Abrir ficha tecnica
                  </button>
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
                    Agrega una ficha tecnica
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {isCatalogMode
                      ? "Crea la receta desde Centro de Recursos para activar costos y rentabilidad."
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
