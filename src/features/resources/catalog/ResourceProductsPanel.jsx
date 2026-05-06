import { LayoutGrid, List, PackagePlus, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { formatCOP } from "../../../utils/formatters";
import { getProfitabilityClasses } from "../recipes/recipeCostingShared";

export default function ResourceProductsPanel({
  isCatalogMode,
  productView,
  onProductViewChange,
  onCreateProduct,
  products,
  productRecipeMap,
  getProductFlowSummary,
  onEditProduct,
  onOpenProductRecipes,
  onDeleteProduct,
}) {
  return (
    <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {isCatalogMode ? "Catalogo de productos" : "Productos"}
          </h2>
          <p className="text-sm text-slate-500">
            {isCatalogMode
              ? "Gestiona el catalogo comercial sin mezclarlo con compras, recetas o costeo."
              : "Cada producto puede conectarse con su ficha tecnica para utilidad neta automatica."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-2xl bg-slate-100 p-1 ring-1 ring-slate-200">
            <button
              type="button"
              onClick={() => onProductViewChange("grid")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${productView === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => onProductViewChange("list")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${productView === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            >
              <List size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={onCreateProduct}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20"
          >
            <Plus size={16} />
            Nuevo producto
          </button>
        </div>
      </div>

      <div className={productView === "grid" ? "grid gap-4 xl:grid-cols-2" : "grid gap-3"}>
        {products.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-5 py-6 shadow-sm xl:col-span-2">
            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <button
                type="button"
                onClick={onCreateProduct}
                className="flex min-h-32 flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center text-slate-500 transition hover:border-emerald-300 hover:text-slate-700"
              >
                <PackagePlus size={24} />
                <p className="mt-3 text-base font-semibold text-slate-700">Crea tu primer producto</p>
                <p className="mt-1 text-sm">Empieza tu catalogo comercial con una ficha limpia.</p>
              </button>

              <div className="rounded-[24px] bg-slate-50 px-5 py-5 ring-1 ring-slate-200">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Flujo inicial
                </p>
                <div className="mt-3 space-y-3 text-sm text-slate-600">
                  <p>1. Define nombre, categoria y precio de venta.</p>
                  <p>2. Si aplica, conecta la ficha tecnica.</p>
                  <p>3. Cuando el catalogo exista, el POS quedara listo para vender.</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {products.map((product) => {
          const recipeBook = productRecipeMap[product.id];
          const margin = Number(recipeBook?.current_margin_pct || 0);
          const flowSummary = getProductFlowSummary({ product, recipeBook });
          const semaforoClasses = getProfitabilityClasses(recipeBook?.profitability_status);

          return (
            <article
              key={product.id}
              className={`group rounded-[28px] bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200 ${productView === "list" ? "flex flex-col gap-4 md:flex-row md:items-center md:justify-between" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {product.category}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{product.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600"
                    >
                      {flowSummary.badge}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200 sm:hidden">
                      {flowSummary.compact}
                    </span>
                  </div>
                  <p className="mt-2 hidden text-sm text-slate-500 sm:block">{flowSummary.detail}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${semaforoClasses}`}>
                  {recipeBook ? `${margin.toFixed(1)}% margen` : "Sin ficha"}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tu precio actual</p>
                  <p className="mt-2 text-right font-mono text-lg font-black text-slate-950">
                    {formatCOP(product.price)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Costo conectado</p>
                  <p className="mt-2 text-right font-mono font-semibold text-slate-900">
                    {formatCOP(recipeBook?.real_cost || 0)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-[#d4a72c]/20">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#946200]">
                    <Sparkles size={14} />
                    Precio recomendado
                  </p>
                  <p className="mt-2 text-right font-mono font-semibold text-slate-900">
                    {formatCOP(recipeBook?.suggested_price || product.price)}
                  </p>
                </div>
              </div>

              <div
                className={`mt-5 grid gap-3 opacity-100 transition xl:opacity-0 xl:group-hover:opacity-100 xl:group-focus-within:opacity-100 ${isCatalogMode ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
              >
                <button
                  type="button"
                  onClick={() => onEditProduct(product)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  <Pencil size={16} />
                  Editar
                </button>
                {!isCatalogMode ? (
                  <button
                    type="button"
                    onClick={() => onOpenProductRecipes(product)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#fff7df] px-4 py-3 text-sm font-semibold text-[#946200] ring-1 ring-[#d4a72c]/20"
                  >
                    <Sparkles size={16} />
                    Ficha
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onDeleteProduct(product)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                >
                  <Trash2 size={16} />
                  Eliminar
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
