import { useMemo, useState } from "react";
import {
  Archive,
  EyeOff,
  LayoutGrid,
  List,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { formatCOP } from "../../../utils/formatters";
import { canPerformAction } from "../../../utils/accountPermissions";
import { calculateFoodCostPercent, calculateGrossMargin, calculateGrossMarginPercent } from "../../../services/productService";
import { getProfitabilityClasses } from "../recipes/recipeCostingShared";

const CATALOG_TABS = [
  { id: "products", label: "Productos" },
  { id: "categories", label: "Categorias" },
  { id: "modifiers", label: "Modificadores" },
  { id: "combos", label: "Combos" },
  { id: "profitability", label: "Rentabilidad" },
];

const STATUS_LABELS = {
  active: "Activo",
  inactive: "Inactivo",
  sold_out: "Agotado",
  hidden: "Oculto",
  temporary: "Temporal",
  archived: "Archivado",
};

const TYPE_LABELS = {
  standard: "Final",
  final_product: "Final",
  base_preparation: "Base",
  combo: "Combo",
  variable: "Variable",
  weighted: "Peso",
  ticket_wallet: "Tiquetera",
};

function StatusPill({ status }) {
  const tone =
    status === "active" || status === "temporary"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "sold_out"
        ? "bg-amber-50 text-amber-800 ring-amber-200"
        : status === "archived"
          ? "bg-slate-100 text-slate-500 ring-slate-200"
          : "bg-rose-50 text-rose-700 ring-rose-200";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tone}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function MetricCard({ label, value, hint, tone = "bg-white text-slate-950 ring-slate-200" }) {
  return (
    <div className={`rounded-2xl px-4 py-3 ring-1 ${tone}`}>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function CategoryForm({ category, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    name: category?.name || "",
    description: category?.description || "",
    color: category?.color || "",
    icon: category?.icon || "",
    sortOrder: String(category?.sortOrder ?? 0),
    active: category?.active ?? true,
    visibleInPOS: category?.visibleInPOS ?? true,
    visibleInReports: category?.visibleInReports ?? true,
  }));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ ...form, sortOrder: Number(form.sortOrder || 0) });
      }}
      className="grid gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"
    >
      <div className="grid gap-3 md:grid-cols-4">
        <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="rounded-xl bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200" />
        <input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Descripcion" className="rounded-xl bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200 md:col-span-2" />
        <input type="number" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} placeholder="Orden" className="rounded-xl bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200" />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        {[
          ["active", "Activa"],
          ["visibleInPOS", "POS"],
          ["visibleInReports", "Reportes"],
        ].map(([field, label]) => (
          <label key={field} className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.checked }))} />
            {label}
          </label>
        ))}
        <button type="submit" className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Guardar</button>
        {onCancel ? <button type="button" onClick={onCancel} className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Cancelar</button> : null}
      </div>
    </form>
  );
}

function ModifierForm({ products, modifier, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    productId: modifier?.productId || modifier?.product_id || products[0]?.id || "",
    name: modifier?.name || "",
    priceDelta: String(modifier?.priceDelta ?? modifier?.price_delta ?? 0),
    affectsInventory: modifier?.affectsInventory ?? modifier?.affects_inventory ?? false,
    linkedInventoryItemId: modifier?.linkedInventoryItemId || "",
    linkedTechnicalSheetId: modifier?.linkedTechnicalSheetId || "",
    stationImpact: modifier?.stationImpact || "",
    active: modifier?.active ?? true,
  }));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(form.productId, { ...form, priceDelta: Number(form.priceDelta || 0) });
      }}
      className="grid gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"
    >
      <div className="grid gap-3 md:grid-cols-4">
        <select value={form.productId} onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))} className="rounded-xl bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200">
          {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
        </select>
        <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Modificador" className="rounded-xl bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200" />
        <input type="number" value={form.priceDelta} onChange={(event) => setForm((current) => ({ ...current, priceDelta: event.target.value }))} placeholder="Delta precio" className="rounded-xl bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200" />
        <input value={form.stationImpact} onChange={(event) => setForm((current) => ({ ...current, stationImpact: event.target.value }))} placeholder="Estacion" className="rounded-xl bg-white px-3 py-2 text-sm outline-none ring-1 ring-slate-200" />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.affectsInventory} onChange={(event) => setForm((current) => ({ ...current, affectsInventory: event.target.checked }))} /> Afecta inventario</label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} /> Activo</label>
        <button type="submit" className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Guardar</button>
        {onCancel ? <button type="button" onClick={onCancel} className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Cancelar</button> : null}
      </div>
    </form>
  );
}

export default function ResourceProductsPanel({
  isCatalogMode,
  activeTab = "products",
  onSelectTab,
  productView,
  onProductViewChange,
  onCreateProduct,
  products,
  categories = [],
  modifiers = [],
  combos = [],
  productRecipeMap,
  recipeBooks = [],
  userProfile,
  getProductFlowSummary,
  onEditProduct,
  onOpenProductRecipes,
  onDuplicateProduct,
  onUpdateProductStatus,
  onCreateCategory,
  onUpdateCategory,
  onCreateModifier,
  onUpdateModifier,
  onDeleteProduct,
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [stationFilter, setStationFilter] = useState("all");
  const [ticketFilter, setTicketFilter] = useState("all");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingModifier, setEditingModifier] = useState(null);
  const canViewCosts =
    canPerformAction(userProfile, "products.viewCosts") ||
    canPerformAction(userProfile, "technicalSheets.viewCosts");

  const productsWithCost = useMemo(
    () =>
      products.map((product) => {
        const recipeBook =
          productRecipeMap[product.id] ||
          recipeBooks.find((recipe) => recipe.id === product.costing?.linkedTechnicalSheetId);
        const cost = Number(recipeBook?.real_cost ?? product.costing?.estimatedCost ?? 0);
        const price = Number(product.price || 0);
        return {
          ...product,
          recipeBook,
          estimatedCost: cost,
          foodCostPercent: calculateFoodCostPercent(cost, price),
          grossMargin: calculateGrossMargin(price, cost),
          grossMarginPercent: calculateGrossMarginPercent(price, cost),
        };
      }),
    [productRecipeMap, products, recipeBooks]
  );

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return productsWithCost.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        String(product.name || "").toLowerCase().includes(normalizedSearch) ||
        String(product.code || "").toLowerCase().includes(normalizedSearch);
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      const matchesType = typeFilter === "all" || product.type === typeFilter || product.product_type === typeFilter;
      const matchesStation = stationFilter === "all" || product.operation?.kitchenStationId === stationFilter;
      const matchesTicket = ticketFilter === "all" || (ticketFilter === "yes" ? product.ticket_eligible : !product.ticket_eligible);
      return matchesSearch && matchesCategory && matchesStatus && matchesType && matchesStation && matchesTicket;
    });
  }, [categoryFilter, productsWithCost, search, stationFilter, statusFilter, ticketFilter, typeFilter]);

  const categoryNames = useMemo(
    () => ["all", ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );
  const stationNames = useMemo(
    () => ["all", ...new Set(products.map((product) => product.operation?.kitchenStationId).filter(Boolean))],
    [products]
  );
  const profitability = useMemo(() => {
    const withMargin = [...productsWithCost].sort((a, b) => b.grossMarginPercent - a.grossMarginPercent);
    return {
      best: withMargin.slice(0, 5),
      worst: [...withMargin].reverse().slice(0, 5),
      withoutSheet: productsWithCost.filter((product) => !product.recipeBook && !product.costing?.linkedTechnicalSheetId),
      withoutCost: productsWithCost.filter((product) => Number(product.estimatedCost || 0) <= 0),
      highFoodCost: productsWithCost.filter((product) => product.foodCostPercent >= 40),
      soldOut: productsWithCost.filter((product) => product.status === "sold_out"),
    };
  }, [productsWithCost]);

  const renderProducts = () => (
    <>
      <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(5,minmax(130px,0.6fr))]">
        <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <Search size={16} className="text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar producto o codigo..." className="w-full bg-transparent text-sm outline-none" />
        </div>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-2xl bg-slate-50 px-3 py-3 text-sm outline-none ring-1 ring-slate-200">
          {categoryNames.map((item) => <option key={item} value={item}>{item === "all" ? "Categorias" : item}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl bg-slate-50 px-3 py-3 text-sm outline-none ring-1 ring-slate-200">
          {["all", "active", "inactive", "sold_out", "hidden", "temporary", "archived"].map((item) => <option key={item} value={item}>{item === "all" ? "Estados" : STATUS_LABELS[item]}</option>)}
        </select>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-2xl bg-slate-50 px-3 py-3 text-sm outline-none ring-1 ring-slate-200">
          {["all", "final_product", "combo", "variable", "weighted", "ticket_wallet", "base_preparation"].map((item) => <option key={item} value={item}>{item === "all" ? "Tipos" : TYPE_LABELS[item]}</option>)}
        </select>
        <select value={stationFilter} onChange={(event) => setStationFilter(event.target.value)} className="rounded-2xl bg-slate-50 px-3 py-3 text-sm outline-none ring-1 ring-slate-200">
          {stationNames.map((item) => <option key={item} value={item}>{item === "all" ? "Estaciones" : item}</option>)}
        </select>
        <select value={ticketFilter} onChange={(event) => setTicketFilter(event.target.value)} className="rounded-2xl bg-slate-50 px-3 py-3 text-sm outline-none ring-1 ring-slate-200">
          <option value="all">Ticketera</option>
          <option value="yes">Valido</option>
          <option value="no">No valido</option>
        </select>
      </div>

      {productView === "list" ? (
        <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Precio</th>
                {canViewCosts ? <th className="px-4 py-3">Costo / Margen</th> : null}
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Operacion</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-950">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.category} · {TYPE_LABELS[product.type] || product.type}</p>
                  </td>
                  <td className="px-4 py-4 font-mono font-semibold">{formatCOP(product.price)}</td>
                  {canViewCosts ? (
                    <td className="px-4 py-4">
                      <p className="font-mono text-slate-900">{formatCOP(product.estimatedCost)}</p>
                      <p className="text-xs text-slate-500">{product.grossMarginPercent.toFixed(1)}% margen · {product.foodCostPercent.toFixed(1)}% FC</p>
                    </td>
                  ) : null}
                  <td className="px-4 py-4"><StatusPill status={product.status} /></td>
                  <td className="px-4 py-4 text-xs text-slate-500">
                    <p>{product.operation?.visibleInPOS ? "POS" : "Oculto POS"} · {product.ticket_eligible ? "Ticket" : "Sin ticket"}</p>
                    <p>{product.operation?.kitchenStationName || "Sin estacion"}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => onEditProduct(product)} className="rounded-xl bg-slate-100 p-2 text-slate-600"><Pencil size={16} /></button>
                      <button type="button" onClick={() => onDuplicateProduct(product)} className="rounded-xl bg-slate-100 p-2 text-slate-600"><Plus size={16} /></button>
                      <button type="button" onClick={() => onUpdateProductStatus(product.id, "sold_out")} className="rounded-xl bg-amber-50 p-2 text-amber-700"><EyeOff size={16} /></button>
                      <button type="button" onClick={() => onDeleteProduct(product)} className="rounded-xl bg-rose-50 p-2 text-rose-700"><Archive size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleProducts.length === 0 ? (
            <button type="button" onClick={onCreateProduct} className="rounded-[24px] border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-slate-500 xl:col-span-2">
              <PackagePlus className="mx-auto" size={24} />
              <p className="mt-3 text-base font-semibold text-slate-700">Crea o ajusta productos para este filtro</p>
            </button>
          ) : null}
          {visibleProducts.map((product) => {
            const flowSummary = getProductFlowSummary({ product, recipeBook: product.recipeBook });
            const semaforoClasses = getProfitabilityClasses(product.recipeBook?.profitability_status);
            return (
              <article key={product.id} className="group rounded-[24px] bg-slate-50 p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{product.category}</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">{product.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusPill status={product.status} />
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">{TYPE_LABELS[product.type] || product.type}</span>
                      {product.ticket_eligible ? <span className="rounded-full bg-[#fff7df] px-2.5 py-1 text-xs font-semibold text-[#7a5200] ring-1 ring-[#d4a72c]/20">Ticketera</span> : null}
                    </div>
                  </div>
                  {canViewCosts ? (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${semaforoClasses}`}>
                      {product.recipeBook ? `${product.grossMarginPercent.toFixed(1)}% margen` : "Sin ficha"}
                    </span>
                  ) : null}
                </div>
                <div className={`mt-5 grid gap-3 ${canViewCosts ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                  <MetricCard label="Precio" value={formatCOP(product.price)} />
                  {canViewCosts ? <MetricCard label="Costo" value={formatCOP(product.estimatedCost)} /> : null}
                  <MetricCard label="Estacion" value={product.operation?.kitchenStationName || "Sin prep."} hint={flowSummary.compact} />
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-4">
                  <button type="button" onClick={() => onEditProduct(product)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"><Pencil size={15} />Editar</button>
                  <button type="button" onClick={() => onDuplicateProduct(product)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"><Plus size={15} />Duplicar</button>
                  {!isCatalogMode ? <button type="button" onClick={() => onOpenProductRecipes(product)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#fff7df] px-3 py-2 text-sm font-semibold text-[#946200] ring-1 ring-[#d4a72c]/20"><Sparkles size={15} />Ficha</button> : <button type="button" onClick={() => onUpdateProductStatus(product.id, "hidden")} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600"><EyeOff size={15} />Ocultar</button>}
                  <button type="button" onClick={() => onDeleteProduct(product)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"><Archive size={15} />Archivar</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <section className="rounded-[24px] bg-white/90 p-5 shadow-lg ring-1 ring-white/70 backdrop-blur">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{isCatalogMode ? "Productos / Catalogo" : "Catalogo"}</h2>
          <p className="text-sm text-slate-500">Producto comercial conectado con ficha tecnica, inventario, POS, salon, caja y BI.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-2xl bg-slate-100 p-1 ring-1 ring-slate-200">
            <button type="button" onClick={() => onProductViewChange("grid")} className={`rounded-xl px-3 py-2 text-sm font-semibold ${productView === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}><LayoutGrid size={16} /></button>
            <button type="button" onClick={() => onProductViewChange("list")} className={`rounded-xl px-3 py-2 text-sm font-semibold ${productView === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}><List size={16} /></button>
          </div>
          <button type="button" onClick={onCreateProduct} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">
            <Plus size={16} /> Nuevo producto
          </button>
        </div>
      </div>

      {isCatalogMode ? (
        <div className="mb-5 flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
          {CATALOG_TABS.map((tab) => (
            <button key={tab.id} type="button" onClick={() => onSelectTab(tab.id)} className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-semibold ${activeTab === tab.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      {activeTab === "products" ? renderProducts() : null}

      {activeTab === "categories" ? (
        <div className="grid gap-4">
          <CategoryForm onSave={(category) => onCreateCategory(category)} />
          <div className="grid gap-3">
            {categories.map((category) => (
              <article key={category.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                {editingCategory?.id === category.id ? (
                  <CategoryForm category={category} onSave={(payload) => { onUpdateCategory(category.id, payload); setEditingCategory(null); }} onCancel={() => setEditingCategory(null)} />
                ) : (
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{category.name}</p>
                      <p className="text-sm text-slate-500">{category.description || "Sin descripcion"} · Orden {category.sortOrder ?? 0}</p>
                    </div>
                    <button type="button" onClick={() => setEditingCategory(category)} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">Editar</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "modifiers" ? (
        <div className="grid gap-4">
          <ModifierForm products={products} onSave={(productId, modifier) => onCreateModifier(productId, modifier)} />
          <div className="grid gap-3">
            {modifiers.map((modifier) => {
              const product = products.find((item) => item.id === (modifier.productId || modifier.product_id));
              return (
                <article key={modifier.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  {editingModifier?.id === modifier.id ? (
                    <ModifierForm products={products} modifier={modifier} onSave={(productId, payload) => { onUpdateModifier(modifier.id, productId, payload); setEditingModifier(null); }} onCancel={() => setEditingModifier(null)} />
                  ) : (
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-slate-950">{modifier.name}</p>
                        <p className="text-sm text-slate-500">{product?.name || "Producto"} · {formatCOP(modifier.priceDelta ?? modifier.price_delta ?? 0)} · {modifier.affectsInventory ? "Afecta inventario" : "Nota/precio"}</p>
                      </div>
                      <button type="button" onClick={() => setEditingModifier(modifier)} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">Editar</button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeTab === "combos" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Combos configurados" value={combos.length} hint="El modelo productCombos queda listo para expansion." />
          <MetricCard label="Productos combo" value={products.filter((product) => product.type === "combo").length} hint="Se descuentan por composicion cuando se conecten items." />
          <MetricCard label="Estaciones mixtas" value="Preparado" hint="Cada hijo puede conservar su estacion." />
        </div>
      ) : null}

      {activeTab === "profitability" ? (
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Sin ficha tecnica" value={profitability.withoutSheet.length} />
            <MetricCard label="Sin costo calculado" value={profitability.withoutCost.length} />
            <MetricCard label="Food cost alto" value={profitability.highFoodCost.length} />
          </div>
          {canViewCosts ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {[
                ["Mejor margen", profitability.best],
                ["Peor margen", profitability.worst],
              ].map(([title, items]) => (
                <div key={title} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <h3 className="font-semibold text-slate-950">{title}</h3>
                  <div className="mt-3 grid gap-2">
                    {items.map((product) => (
                      <div key={product.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
                        <span>{product.name}</span>
                        <span className="font-mono font-semibold">{product.grossMarginPercent.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 ring-1 ring-slate-200">
              Tu rol no tiene permiso para ver costos, margen o food cost.
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Agotados" value={profitability.soldOut.length} tone="bg-amber-50 text-amber-900 ring-amber-200" />
            <MetricCard label="Ticketera validos" value={products.filter((product) => product.ticket_eligible).length} tone="bg-[#fff7df] text-[#7a5200] ring-[#d4a72c]/20" />
            <MetricCard label="Requieren cocina/barra" value={products.filter((product) => product.operation?.requiresKitchen).length} tone="bg-sky-50 text-sky-900 ring-sky-200" />
          </div>
        </div>
      ) : null}
    </section>
  );
}
