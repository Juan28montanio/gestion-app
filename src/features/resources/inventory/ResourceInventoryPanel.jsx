import { Boxes, ClipboardList, LayoutGrid, List, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { formatCOP } from "../../../utils/formatters";

export default function ResourceInventoryPanel({
  supplies,
  ingredientView,
  onIngredientViewChange,
  supplySummary,
  priceHistoryBySupply,
  recipeImpactBySupply,
  preparationImpactBySupply,
  spendByCategory,
  onCreateSupply,
  onEditSupply,
  onDeleteSupply,
  getSupplyHealth,
}) {
  return (
    <section className="space-y-6">
      <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Inventario de insumos</h2>
            <p className="text-sm text-slate-500">
              Alterna entre lectura visual, tabla operativa y alertas para controlar stock y costo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-2xl bg-slate-100 p-1 ring-1 ring-slate-200">
              <button
                type="button"
                onClick={() => onIngredientViewChange("grid")}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${ingredientView === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => onIngredientViewChange("list")}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${ingredientView === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => onIngredientViewChange("alerts")}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${ingredientView === "alerts" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                <ClipboardList size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={onCreateSupply}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20"
            >
              <Plus size={16} />
              Nuevo insumo
            </button>
          </div>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Saludables</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{supplySummary.healthy}</p>
          </article>
          <article className="rounded-[24px] bg-amber-50 p-4 ring-1 ring-amber-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Atencion</p>
            <p className="mt-2 text-2xl font-black text-amber-900">{supplySummary.attention}</p>
          </article>
          <article className="rounded-[24px] bg-rose-50 p-4 ring-1 ring-rose-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700">Criticos</p>
            <p className="mt-2 text-2xl font-black text-rose-900">{supplySummary.critical}</p>
          </article>
          <article className="rounded-[24px] bg-slate-950 p-4 text-white ring-1 ring-slate-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Agotados</p>
            <p className="mt-2 text-2xl font-black">{supplySummary.depleted}</p>
          </article>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className={ingredientView === "grid" ? "grid gap-4 md:grid-cols-2" : "grid gap-3"}>
            {supplies.length === 0 ? (
              <button
                type="button"
                onClick={onCreateSupply}
                className="flex min-h-32 flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-300 bg-white px-5 py-6 text-center text-slate-500 transition hover:border-emerald-300 hover:text-slate-700"
              >
                <Boxes size={24} />
                <p className="mt-3 text-base font-semibold text-slate-700">Crea tu primer insumo</p>
                <p className="mt-1 text-sm">Define materias primas para costeo y compras.</p>
              </button>
            ) : null}
            {ingredientView === "alerts"
              ? (() => {
                  const alertSupplies = supplies.filter(
                    (supply) => getSupplyHealth(supply).label !== "Saludable"
                  );

                  if (alertSupplies.length === 0) {
                    return (
                      <article className="rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50/60 px-5 py-8 text-center">
                        <p className="text-base font-semibold text-emerald-900">
                          No hay alertas activas de inventario.
                        </p>
                        <p className="mt-2 text-sm leading-6 text-emerald-800/80">
                          El stock actual no muestra faltantes inmediatos. Puedes usar esta vista para validar de forma preventiva antes de la siguiente compra.
                        </p>
                      </article>
                    );
                  }

                  return alertSupplies.map((supply) => {
                    const status = getSupplyHealth(supply);
                    const stock = Number(supply.stock || 0);
                    const min = Number(supply.stock_min_alert || 0);
                    const missing = Math.max(min - stock, 0);
                    const latestPurchase = (priceHistoryBySupply[supply.id] || [])[0];
                    const linkedRecipes = recipeImpactBySupply[supply.id] || 0;
                    const linkedPreparations = preparationImpactBySupply[supply.id] || 0;

                    return (
                      <article key={supply.id} className="rounded-[24px] bg-white p-5 shadow-lg ring-1 ring-slate-200">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {supply.category || "Sin categoria"}
                            </p>
                            <h3 className="mt-2 text-lg font-semibold text-slate-900">{supply.name}</h3>
                            <p className="mt-2 text-sm text-slate-500">
                              {missing > 0
                                ? `Faltan ${missing} ${supply.unit} para volver al minimo.`
                                : "Revisa el nivel actual para evitar quiebres de stock."}
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                              {linkedPreparations + linkedRecipes > 0
                                ? `${linkedPreparations} preparacion(es) y ${linkedRecipes} ficha(s) dependen de este insumo.`
                                : "Aun no impacta preparaciones ni fichas tecnicas conectadas."}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.classes}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Stock actual</p>
                            <p className="mt-2 font-semibold text-slate-900">
                              {stock} {supply.unit}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Minimo</p>
                            <p className="mt-2 font-semibold text-slate-900">
                              {min} {supply.unit}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Ultima compra</p>
                            <p className="mt-2 font-semibold text-slate-900">
                              {latestPurchase ? formatCOP(latestPurchase.unitCost) : "Sin registro"}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  });
                })()
              : supplies.map((supply) => {
                  const status = getSupplyHealth(supply);
                  const history = priceHistoryBySupply[supply.id] || [];
                  const stock = Number(supply.stock || 0);
                  const min = Number(supply.stock_min_alert || 0);
                  const missing = Math.max(min - stock, 0);
                  const linkedRecipes = recipeImpactBySupply[supply.id] || 0;
                  const linkedPreparations = preparationImpactBySupply[supply.id] || 0;

                  return (
                    <article
                      key={supply.id}
                      className={`rounded-[28px] bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200 ${ingredientView === "list" ? "flex flex-col gap-4 md:flex-row md:items-center md:justify-between" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {supply.category || "Sin categoria"}
                          </p>
                          <h3 className="mt-2 text-lg font-semibold text-slate-900">{supply.name}</h3>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.classes}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Stock</p>
                          <p className="mt-2 font-semibold text-slate-900">
                            {stock} {supply.unit}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">CPP</p>
                          <p className="mt-2 font-semibold text-slate-900">{formatCOP(supply.average_cost)}</p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Minimo</p>
                          <p className="mt-2 font-semibold text-slate-900">
                            {supply.stock_min_alert || 0} {supply.unit}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 sm:col-span-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Uso en recetas</p>
                          <p className="mt-2 font-semibold text-slate-900">
                            {linkedPreparations + linkedRecipes > 0
                              ? `${linkedPreparations} preparacion(es) y ${linkedRecipes} ficha(s) dependen de este insumo`
                              : "Todavia no afecta preparaciones ni fichas tecnicas conectadas"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Lectura operativa</p>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Estado del minimo</span>
                            <span className="font-semibold text-slate-900">
                              {missing > 0 ? `Faltan ${missing} ${supply.unit}` : "Cobertura estable"}
                            </span>
                          </div>
                          {history.slice(0, 3).map((entry, index) => (
                            <div key={`${supply.id}-history-${index}`} className="flex items-center justify-between text-sm">
                              <span className="text-slate-500">{entry.date}</span>
                              <span className="font-semibold text-slate-900">{formatCOP(entry.unitCost)}</span>
                            </div>
                          ))}
                          {history.length === 0 ? (
                            <p className="text-sm text-slate-500">Sin compras registradas todavia.</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => onEditSupply(supply)}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                        >
                          <Pencil size={16} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSupply(supply)}
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

          <div className="rounded-[28px] bg-slate-50 p-5 shadow-lg ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-[#d4a72c]/20 bg-[#fff7df] p-3 text-[#946200]">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Gasto por categorias</h3>
                <p className="text-sm text-slate-500">
                  Identifica donde se concentra el presupuesto de compras.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {spendByCategory.map((entry) => (
                <div key={entry.category}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{entry.category}</span>
                    <span className="text-slate-500">
                      {entry.sharePct.toFixed(0)}% · {formatCOP(entry.total)}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-[#d4a72c]"
                      style={{ width: `${Math.max(entry.sharePct, 8)}%` }}
                    />
                  </div>
                </div>
              ))}

              {spendByCategory.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Registra compras para ver la distribucion real del presupuesto por categoria.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
