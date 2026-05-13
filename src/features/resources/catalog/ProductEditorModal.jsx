import { ChefHat, PackagePlus, Plus, Sparkles, Ticket, X } from "lucide-react";
import ModalWrapper from "../../../components/ModalWrapper";
import FormInput from "../../../components/FormInput";
import FormSelect from "../../../components/FormSelect";
import { formatCOP } from "../../../utils/formatters";
import { DEFAULT_KITCHEN_STATIONS, PRODUCT_STATUSES, PRODUCT_TYPES } from "../../../services/productService";

const PRODUCT_TYPE_LABELS = {
  final_product: "Producto final vendible",
  standard: "Producto final legacy",
  base_preparation: "Preparacion base",
  combo: "Combo / compuesto",
  variable: "Producto variable",
  weighted: "Producto por peso",
  ticket_wallet: "Tiquetera prepaga",
};

const STATUS_LABELS = {
  active: "Activo",
  inactive: "Inactivo",
  sold_out: "Agotado",
  hidden: "Oculto en POS",
  temporary: "Temporal",
  archived: "Archivado",
};

function BooleanToggle({ checked, onChange, title, description }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
      <span>
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        {description ? <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span> : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
      />
    </label>
  );
}

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
  productCategoryDocs = [],
  recipeBooks = [],
  productModalMetrics,
  onOpenRecipe,
  feedbackMessage,
  isCatalogMode,
  currentProductRecipe,
}) {
  const isProductSubmitBlocked =
    isSaving || !canSaveProduct || Boolean(productDuplicates?.exactMatch);
  const updateField = (field, value) =>
    setProductForm((current) => ({ ...current, [field]: value }));
  const selectedCategory = productCategoryDocs.find((category) => category.name === productForm.category);

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-6xl"
      icon={{ main: <PackagePlus size={20} />, close: <X size={18} /> }}
      title={editingProductId ? "Editar producto" : "Nuevo producto"}
      description="Conecta venta, operacion, ficha tecnica, inventario, ticketera y rentabilidad desde un solo registro."
    >
      <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="grid gap-5">
          <div className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="flex items-center gap-2">
              <PackagePlus size={18} className="text-emerald-600" />
              <h3 className="font-semibold text-slate-950">Comercial</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput label="Nombre" required value={productForm.name} onChange={(event) => updateField("name", event.target.value)} />
              <FormInput label="Codigo" value={productForm.code} onChange={(event) => updateField("code", event.target.value)} />
              <FormInput
                label="Categoria"
                required
                list="product-category-options"
                value={productForm.category}
                onChange={(event) => {
                  const category = productCategoryDocs.find((item) => item.name === event.target.value);
                  setProductForm((current) => ({
                    ...current,
                    category: event.target.value,
                    categoryId: category?.id || "",
                  }));
                }}
              />
              <FormSelect
                label="Tipo"
                value={productForm.productType}
                onChange={(event) => updateField("productType", event.target.value)}
                options={PRODUCT_TYPES.map((type) => ({ value: type, label: PRODUCT_TYPE_LABELS[type] || type }))}
              />
              <FormSelect
                label="Estado"
                value={productForm.status}
                onChange={(event) => updateField("status", event.target.value)}
                options={PRODUCT_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] || status }))}
              />
              <FormInput label="Tags" value={productForm.tags} onChange={(event) => updateField("tags", event.target.value)} hint="Separados por coma." />
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Descripcion
              <textarea
                value={productForm.description}
                onChange={(event) => updateField("description", event.target.value)}
                rows={3}
                className="rounded-2xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-emerald-300"
              />
            </label>
            <datalist id="product-category-options">
              {productCategories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </div>

          <div className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-600" />
              <h3 className="font-semibold text-slate-950">Precio y rentabilidad</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <FormInput label="Precio base" type="number" min="0" step="1" value={productForm.price} onChange={(event) => updateField("price", event.target.value)} />
              <FormInput label="IVA / impuesto %" type="number" min="0" step="0.1" value={productForm.taxRate} onChange={(event) => updateField("taxRate", event.target.value)} />
              <FormInput label="Food cost objetivo %" type="number" min="1" step="1" value={productForm.targetFoodCost} onChange={(event) => updateField("targetFoodCost", event.target.value)} />
              <FormInput label="Precio sugerido" value={formatCOP(productModalMetrics.suggestedPrice || 0)} readOnly />
            </div>
            <button
              type="button"
              onClick={() => updateField("price", String(Math.round(productModalMetrics.suggestedPrice || 0)))}
              disabled={!productModalMetrics.suggestedPrice}
              className="w-fit rounded-2xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Usar precio sugerido
            </button>
          </div>

          <div className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="flex items-center gap-2">
              <ChefHat size={18} className="text-sky-600" />
              <h3 className="font-semibold text-slate-950">Operacion</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <FormSelect
                label="Estacion"
                value={productForm.kitchenStationId}
                onChange={(event) => {
                  const station = DEFAULT_KITCHEN_STATIONS.find((item) => item.id === event.target.value);
                  setProductForm((current) => ({
                    ...current,
                    kitchenStationId: event.target.value,
                    kitchenStationName: station?.name || current.kitchenStationName,
                    requiresKitchen: event.target.value !== "none",
                  }));
                }}
                options={DEFAULT_KITCHEN_STATIONS.map((station) => ({ value: station.id, label: station.name }))}
              />
              <FormInput label="Tiempo prep. min" type="number" min="0" step="1" value={productForm.preparationTime} onChange={(event) => updateField("preparationTime", event.target.value)} />
              <FormInput label="Orden POS" type="number" step="1" value={productForm.sortOrder} onChange={(event) => updateField("sortOrder", event.target.value)} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <BooleanToggle checked={productForm.visibleInPOS} onChange={(value) => updateField("visibleInPOS", value)} title="Visible en POS" description="Aparece para venta rapida y toma de pedidos." />
              <BooleanToggle checked={productForm.visibleInMenu} onChange={(value) => updateField("visibleInMenu", value)} title="Visible en menu" description="Listo para menu digital o QR." />
              <BooleanToggle checked={productForm.availableForTables} onChange={(value) => updateField("availableForTables", value)} title="Disponible en salon" description="Puede agregarse desde mesas." />
              <BooleanToggle checked={productForm.availableForQuickSale} onChange={(value) => updateField("availableForQuickSale", value)} title="Disponible venta rapida" description="Puede cobrarse sin mesa." />
              <BooleanToggle checked={productForm.isFavorite} onChange={(value) => updateField("isFavorite", value)} title="Favorito POS" description="Prioriza accesos rapidos." />
              <BooleanToggle checked={productForm.requiresKitchen} onChange={(value) => updateField("requiresKitchen", value)} title="Enviar a cocina/barra" description="Incluye estacion y notas operativas en la orden." />
            </div>
          </div>

          <div className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <h3 className="font-semibold text-slate-950">Ficha tecnica e inventario</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FormSelect
                label="Ficha tecnica asociada"
                value={productForm.linkedTechnicalSheetId}
                onChange={(event) => {
                  setProductForm((current) => ({
                    ...current,
                    linkedTechnicalSheetId: event.target.value,
                    consumesInventory: Boolean(event.target.value) || current.consumesInventory,
                    inventoryImpactMode: event.target.value ? "technical_sheet" : current.inventoryImpactMode,
                  }));
                }}
                options={[
                  { value: "", label: "Sin ficha tecnica" },
                  ...recipeBooks.map((recipeBook) => ({
                    value: recipeBook.id,
                    label: recipeBook.product_name || recipeBook.name,
                  })),
                ]}
              />
              <FormSelect
                label="Impacto inventario"
                value={productForm.inventoryImpactMode}
                onChange={(event) => updateField("inventoryImpactMode", event.target.value)}
                options={[
                  { value: "none", label: "No descuenta" },
                  { value: "technical_sheet", label: "Por ficha tecnica" },
                  { value: "direct_item", label: "Insumo directo" },
                  { value: "combo", label: "Por productos del combo" },
                ]}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <BooleanToggle checked={productForm.consumesInventory} onChange={(value) => updateField("consumesInventory", value)} title="Consume inventario" description="El descuento ideal se hace por ficha tecnica." />
              <BooleanToggle checked={productForm.allowSaleWhenStockLow} onChange={(value) => updateField("allowSaleWhenStockLow", value)} title="Permitir venta con stock bajo" description="No bloquea caja, pero conserva la senal operativa." />
            </div>
          </div>

          <div className="grid gap-4 rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="flex items-center gap-2">
              <Ticket size={18} className="text-amber-600" />
              <h3 className="font-semibold text-slate-950">Ticketera</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <BooleanToggle checked={productForm.ticketEligible} onChange={(value) => updateField("ticketEligible", value)} title="Valido para consumo con ticket" description="El POS podra cubrir este producto con saldo prepago." />
              <FormInput label="Tipo de elegibilidad" value={productForm.ticketEligibilityType} onChange={(event) => updateField("ticketEligibilityType", event.target.value)} />
              <FormInput label="Referencia de valor" value={productForm.ticketValueReference} onChange={(event) => updateField("ticketValueReference", event.target.value)} />
              <FormInput label="Planes permitidos" value={productForm.allowedTicketPlans} onChange={(event) => updateField("allowedTicketPlans", event.target.value)} hint="IDs separados por coma, opcional." />
              <FormInput label="Tickets que otorga" type="number" min="0" step="1" value={productForm.ticketUnits} onChange={(event) => updateField("ticketUnits", event.target.value)} readOnly={productForm.productType !== "ticket_wallet"} />
              <FormInput label="Vigencia ticketera dias" type="number" min="1" step="1" value={productForm.ticketValidityDays} onChange={(event) => updateField("ticketValidityDays", event.target.value)} readOnly={productForm.productType !== "ticket_wallet"} />
            </div>
          </div>

          {productDuplicates?.nameMatches?.length > 0 && !productDuplicates?.exactMatch ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
              Ya existe {productDuplicates.nameMatches.length === 1 ? "un producto con este nombre" : `${productDuplicates.nameMatches.length} productos con este nombre`}. Ajusta categoria o contexto para evitar ambiguedad en POS y fichas.
            </div>
          ) : null}

          {productDuplicates?.exactMatch ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
              Este producto parece duplicado de un registro existente.
            </div>
          ) : null}

          {feedbackMessage ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
              {feedbackMessage}
            </div>
          ) : null}

          <div className="sticky bottom-0 z-10 grid gap-3 rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:grid-cols-2">
            <button type="button" onClick={onClose} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              Cancelar
            </button>
            <button type="submit" disabled={isProductSubmitBlocked} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
              {isSaving ? "Guardando..." : editingProductId ? "Actualizar producto" : "Crear producto"}
            </button>
          </div>
        </div>

        <aside className="grid content-start gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-inner">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Lectura actual</p>
            <h4 className="mt-2 text-lg font-semibold text-slate-950">
              {currentProductRecipe ? "Ficha tecnica conectada" : "Sin ficha tecnica"}
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {selectedCategory?.description || "El producto conserva compatibilidad con POS, salon, caja y ventas historicas."}
            </p>
          </div>
          <div className="grid gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Costo estimado</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{formatCOP(productModalMetrics.realCost)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Margen bruto</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{productModalMetrics.currentMarginPct.toFixed(1)}%</p>
            </div>
            <div className="rounded-2xl bg-[#fff7df] px-4 py-4 ring-1 ring-[#d4a72c]/20">
              <p className="text-xs uppercase tracking-[0.18em] text-[#946200]">Precio sugerido</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{formatCOP(productModalMetrics.suggestedPrice || 0)}</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5">
            {currentProductRecipe ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-800">{`${productModalMetrics.ingredientsCount} insumos conectados`}</p>
                <p className="text-sm text-slate-500">Compras actualiza insumos, fichas recalculan costos y este producto queda listo para margen y BI.</p>
                {!isCatalogMode ? (
                  <button type="button" onClick={onOpenRecipe} className="inline-flex rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">
                    Abrir ficha tecnica
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <button type="button" onClick={onOpenRecipe} disabled={isCatalogMode} className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
                  <Plus size={22} />
                </button>
                <p className="text-sm text-slate-500">
                  {isCatalogMode ? "Crea o conecta la ficha desde Recursos para activar costos reales." : "Enlaza una ficha tecnica para activar costo, inventario y precio sugerido."}
                </p>
              </div>
            )}
          </div>
        </aside>
      </form>
    </ModalWrapper>
  );
}
