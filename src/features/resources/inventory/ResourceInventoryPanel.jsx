import { AlertTriangle, Boxes, Eye, Pencil, Plus, Power, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { formatCOP } from "../../../utils/formatters";
import { SUPPLY_STATUS_OPTIONS, SUPPLY_TYPE_OPTIONS } from "../../../utils/resourceOptions";
import {
  getSupplyBaseUnit,
  getSupplyCostPerBaseUnit,
  getSupplyCurrentStock,
  getSupplyMinimumStock,
  getSupplyReorderPoint,
  getSupplyUsefulYield,
  getSupplyWastePercent,
} from "./supplyCalculations";

const TYPE_LABELS = SUPPLY_TYPE_OPTIONS.reduce((acc, option) => {
  if (option.value) {
    acc[option.value] = option.label;
  }
  return acc;
}, {});

const STATUS_LABELS = SUPPLY_STATUS_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

function normalizeComparableValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function Metric({ label, value, tone = "bg-white text-slate-950 ring-slate-200", hint }) {
  return (
    <article className={`rounded-[22px] p-4 ring-1 ${tone}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      {hint ? <p className="mt-1 text-sm opacity-70">{hint}</p> : null}
    </article>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function ResourceInventoryPanel({
  supplies,
  supplySummary,
  priceHistoryBySupply,
  recipeImpactBySupply,
  spendByCategory,
  onCreateSupply,
  onEditSupply,
  onDeleteSupply,
  getSupplyHealth,
}) {
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    type: "",
    status: "",
    lowStock: false,
  });
  const [detailSupply, setDetailSupply] = useState(null);
  const safeSupplies = Array.isArray(supplies) ? supplies : [];
  const categoryOptions = useMemo(
    () => [...new Set(safeSupplies.map((supply) => supply.category).filter(Boolean))].sort(),
    [safeSupplies]
  );
  const filteredSupplies = useMemo(() => {
    const search = normalizeComparableValue(filters.search);

    return safeSupplies.filter((supply) => {
      const status = getSupplyHealth(supply);
      const matchesSearch =
        !search ||
        normalizeComparableValue(`${supply.name} ${supply.code} ${supply.category}`).includes(search);
      const matchesCategory = !filters.category || supply.category === filters.category;
      const matchesType = !filters.type || (supply.type || "raw_material") === filters.type;
      const matchesStatus = !filters.status || (supply.status || "active") === filters.status;
      const matchesLowStock = !filters.lowStock || ["depleted", "critical", "low"].includes(status.key);

      return matchesSearch && matchesCategory && matchesType && matchesStatus && matchesLowStock;
    });
  }, [filters, getSupplyHealth, safeSupplies]);

  const strategicSummary = useMemo(() => {
    const highWaste = safeSupplies.filter((supply) => getSupplyWastePercent(supply) >= 12).length;
    const totalValue = safeSupplies.reduce(
      (sum, supply) => sum + getSupplyCurrentStock(supply) * getSupplyCostPerBaseUnit(supply),
      0
    );

    return { highWaste, totalValue };
  }, [safeSupplies]);

  const renderDetail = () => {
    if (!detailSupply) {
      return null;
    }

    const stockStatus = getSupplyHealth(detailSupply);
    const history = priceHistoryBySupply[detailSupply.id] || [];
    const linkedRecipes = recipeImpactBySupply[detailSupply.id] || 0;
    const baseUnit = getSupplyBaseUnit(detailSupply);
    const stock = getSupplyCurrentStock(detailSupply);
    const min = getSupplyMinimumStock(detailSupply);
    const usefulYield = getSupplyUsefulYield(detailSupply);

    return (
      <div className="fixed inset-0 z-[90] bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
        <div className="mx-auto flex max-h-[90vh] max-w-6xl flex-col overflow-hidden rounded-[28px] bg-slate-50 shadow-[0_30px_120px_rgba(15,23,42,0.22)]">
          <div className="border-b border-slate-200 bg-white px-6 py-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Ficha profesional de insumo
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">{detailSupply.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {TYPE_LABELS[detailSupply.type] || "Materia prima"} · {detailSupply.category || "Sin categoria"}
                </p>
              </div>
              <button type="button" onClick={() => setDetailSupply(null)} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
                Cerrar
              </button>
            </div>
          </div>
          <div className="grid gap-5 overflow-y-auto p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric label="Costo unidad base" value={formatCOP(getSupplyCostPerBaseUnit(detailSupply))} hint={`Por ${baseUnit}`} />
              <Metric label="Stock actual" value={`${stock} ${baseUnit}`} tone="bg-emerald-50 text-emerald-900 ring-emerald-200" />
              <Metric label="Rendimiento util" value={`${usefulYield.toFixed(2)} ${baseUnit}`} />
              <Metric label="Fichas conectadas" value={linkedRecipes} />
            </div>
            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
                <h4 className="text-base font-semibold text-slate-900">Operacion</h4>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <DetailRow label="Estado" value={STATUS_LABELS[detailSupply.status || "active"] || "Activo"} />
                  <DetailRow label="Alerta" value={stockStatus.label} />
                  <DetailRow label="Stock minimo" value={`${min} ${baseUnit}`} />
                  <DetailRow label="Punto reposicion" value={`${getSupplyReorderPoint(detailSupply).toFixed(2)} ${baseUnit}`} />
                  <DetailRow label="Ubicacion" value={detailSupply.inventory?.location || "Sin ubicacion"} />
                  <DetailRow label="Proveedor" value={detailSupply.supplier?.supplierName || detailSupply.supplier_name || "Sin proveedor"} />
                </div>
              </section>
              <section className="rounded-[24px] bg-slate-50 p-5 ring-1 ring-slate-200">
                <h4 className="text-base font-semibold text-slate-900">Costos y merma</h4>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <DetailRow label="Costo actual" value={formatCOP(detailSupply.costs?.currentCost ?? detailSupply.average_cost)} />
                  <DetailRow label="Costo promedio" value={formatCOP(detailSupply.costs?.averageCost ?? detailSupply.average_cost)} />
                  <DetailRow label="Ultimo costo" value={formatCOP(detailSupply.costs?.lastCost ?? detailSupply.last_purchase_cost)} />
                  <DetailRow label="Merma natural" value={`${getSupplyWastePercent(detailSupply)}%`} />
                  <DetailRow label="Conservacion" value={detailSupply.storage?.type || "Sin dato"} />
                  <DetailRow label="Vida util" value={`${detailSupply.storage?.shelfLifeClosed || 0}/${detailSupply.storage?.shelfLifeOpened || 0} ${detailSupply.storage?.timeUnit || "dias"}`} />
                </div>
              </section>
            </div>
            <section className="rounded-[24px] bg-white p-5 ring-1 ring-slate-200">
              <h4 className="text-base font-semibold text-slate-900">Trazabilidad preparada</h4>
              <div className="mt-4 grid gap-3 md:grid-cols-5">
                {["Compras", "Movimientos", "Consumo", "Produccion", "Desperdicios"].map((item, index) => (
                  <div key={item} className={`rounded-2xl px-4 py-3 text-sm font-semibold ring-1 ${index === 0 ? "bg-emerald-50 text-emerald-900 ring-emerald-200" : "bg-slate-50 text-slate-600 ring-slate-200"}`}>
                    {item}
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-[24px] bg-white p-5 ring-1 ring-slate-200">
              <h4 className="text-base font-semibold text-slate-900">Historial de compras</h4>
              <div className="mt-4 grid gap-2">
                {history.slice(0, 6).map((entry, index) => (
                  <div key={`${detailSupply.id}-history-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm ring-1 ring-slate-200">
                    <span className="text-slate-500">{entry.date}</span>
                    <span className="font-semibold text-slate-900">{formatCOP(entry.unitCost)}</span>
                  </div>
                ))}
                {history.length === 0 ? <p className="text-sm text-slate-500">Sin compras registradas todavia.</p> : null}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold text-slate-900">Insumos estrategicos</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Administra materia prima, producciones base y recursos operativos con unidades base, costo real, stock, merma y trazabilidad preparada.
            </p>
          </div>
          <button type="button" onClick={onCreateSupply} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20">
            <Plus size={16} />
            Nuevo insumo
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Metric label="Saludables" value={supplySummary.healthy} tone="bg-emerald-50 text-emerald-900 ring-emerald-200" />
          <Metric label="Atencion" value={supplySummary.attention} tone="bg-amber-50 text-amber-900 ring-amber-200" />
          <Metric label="Criticos" value={supplySummary.critical + supplySummary.depleted} tone="bg-rose-50 text-rose-900 ring-rose-200" />
          <Metric label="Merma alta" value={strategicSummary.highWaste} />
          <Metric label="Valor stock" value={formatCOP(strategicSummary.totalValue)} />
        </div>
      </section>

      <section className="rounded-[28px] bg-white/85 p-5 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Buscar por nombre, codigo o categoria" className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5" />
          </label>
          <select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
            <option value="">Todas las categorias</option>
            {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
            {SUPPLY_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.value ? option.label : "Todos los tipos"}</option>)}
          </select>
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
            <option value="">Todos los estados</option>
            {SUPPLY_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <label className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={filters.lowStock} onChange={(event) => setFilters((current) => ({ ...current, lowStock: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            Stock bajo
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] bg-white/85 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Insumo</th>
                <th className="px-5 py-4">Tipo</th>
                <th className="px-5 py-4">Unidad base</th>
                <th className="px-5 py-4">Costo unitario</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredSupplies.map((supply) => {
                const status = getSupplyHealth(supply);
                const waste = getSupplyWastePercent(supply);
                const linkedRecipes = recipeImpactBySupply[supply.id] || 0;
                const isInactive = (supply.status || "active") === "inactive";

                return (
                  <tr key={supply.id} className={isInactive ? "bg-slate-50/70 text-slate-400" : "text-slate-700"}>
                    <td className="px-5 py-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-950">{supply.name}</p>
                          {waste >= 12 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                              <AlertTriangle size={12} />
                              Merma alta
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {supply.code || "Sin codigo"} · {supply.category || "Sin categoria"} · {linkedRecipes} ficha(s)
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">{TYPE_LABELS[supply.type] || "Materia prima"}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{getSupplyBaseUnit(supply)}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">{formatCOP(getSupplyCostPerBaseUnit(supply))}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{getSupplyCurrentStock(supply)} {getSupplyBaseUnit(supply)}</p>
                      <p className="text-xs text-slate-500">Min {getSupplyMinimumStock(supply)} · Rep {getSupplyReorderPoint(supply).toFixed(1)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.classes}`}>{status.label}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setDetailSupply(supply)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200" title="Ver">
                          <Eye size={16} />
                        </button>
                        <button type="button" onClick={() => onEditSupply(supply)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200" title="Editar">
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => onDeleteSupply(supply)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100" title="Desactivar">
                          <Power size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredSupplies.length === 0 ? (
          <button type="button" onClick={onCreateSupply} className="flex min-h-32 w-full flex-col items-center justify-center border-t border-dashed border-slate-300 bg-white px-5 py-6 text-center text-slate-500 transition hover:text-slate-700">
            <Boxes size={24} />
            <p className="mt-3 text-base font-semibold text-slate-700">Crea tu primer insumo profesional</p>
            <p className="mt-1 text-sm">Define unidades base, costo, inventario y merma para activar el costeo real.</p>
          </button>
        ) : null}
      </section>

      <section className="rounded-[28px] bg-white/85 p-5 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <h3 className="text-lg font-semibold text-slate-900">Gasto por categorias</h3>
        <div className="mt-5 space-y-4">
          {spendByCategory.map((entry) => (
            <div key={entry.category}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{entry.category}</span>
                <span className="text-slate-500">{entry.sharePct.toFixed(0)}% · {formatCOP(entry.total)}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-200">
                <div className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-[#d4a72c]" style={{ width: `${Math.max(entry.sharePct, 8)}%` }} />
              </div>
            </div>
          ))}
          {spendByCategory.length === 0 ? <p className="text-sm text-slate-500">Registra compras para ver la distribucion real del presupuesto por categoria.</p> : null}
        </div>
      </section>

      {renderDetail()}
    </section>
  );
}
