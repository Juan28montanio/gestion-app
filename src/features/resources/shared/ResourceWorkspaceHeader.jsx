export default function ResourceWorkspaceHeader({
  resourceStats,
  resourceDecisionSummary,
  resourceDecisionItems,
  onOpenDecisionCenter,
  tabs,
  activeTab,
  onSelectTab,
}) {
  const activeTabCopy = {
    suppliers: {
      title: "Relacion con proveedores",
      body: "Consolida el directorio, revisa plazos y prepara mejores decisiones antes de comprar.",
    },
    ingredients: {
      title: "Inventario de insumos",
      body: "Controla stock, costo promedio y dependencia de recetas desde una sola lectura operativa.",
    },
    purchases: {
      title: "Registro de compras",
      body: "Carga facturas con contexto comercial para que inventario, caja y costeo queden alineados.",
    },
    recipes: {
      title: "Fichas tecnicas",
      body: "Convierte costos e insumos en una lectura clara de rentabilidad y consistencia de produccion.",
    },
    products: {
      title: "Catalogo conectado",
      body: "Cruza el producto vendido con inventario, fichas tecnicas y margen antes de tocar precios.",
    },
  }[activeTab] || {
    title: "Centro de recursos",
    body: "Organiza abastecimiento, compras y costeo sin mezclar el catalogo comercial.",
  };

  return (
    <>
      <section className="rounded-lg border border-[#d8ddcf] bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Centro de recursos</h2>
            <p className="text-sm text-slate-500">
              Organiza abastecimiento, compras y costeo sin mezclar el catalogo comercial.
            </p>
          </div>
          <div className="rounded-lg bg-[#f5f6ef] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900 ring-1 ring-[#d8ddcf]">
            Ingenieria del negocio
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {resourceStats.map((stat) => (
            <article
              key={stat.id}
              className="min-w-[220px] flex-1 rounded-lg border border-[#d8ddcf] bg-[#f8faf3] px-4 py-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {stat.label}
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-900">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500">{stat.hint}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-lg border border-[#d8ddcf] bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-900">
            Flujo activo
          </p>
          <h3 className="mt-2 text-base font-semibold text-slate-900">{activeTabCopy.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{activeTabCopy.body}</p>
        </div>

        <div className="mt-5 rounded-lg border border-[#d8ddcf] bg-[linear-gradient(135deg,#ffffff_0%,#f8fbf3_100%)] px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Centro de decisiones
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{resourceDecisionSummary}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold ${
                  resourceDecisionItems.length > 0
                    ? "bg-[#10251d] text-white"
                    : "bg-[#f5f6ef] text-slate-500"
                }`}
              >
                {resourceDecisionItems.length} lectura
                {resourceDecisionItems.length === 1 ? "" : "s"} activa
                {resourceDecisionItems.length === 1 ? "" : "s"}
              </div>
              <button
                type="button"
                onClick={onOpenDecisionCenter}
                disabled={resourceDecisionItems.length === 0}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  resourceDecisionItems.length > 0
                    ? "border-[#d8ddcf] bg-white text-slate-700 hover:bg-[#f5f6ef]"
                    : "cursor-not-allowed border-[#d8ddcf] bg-[#f5f6ef] text-slate-400"
                }`}
              >
                Ver panel
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#d8ddcf] bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#10251d] text-white"
                    : "bg-[#f5f6ef] text-slate-600 hover:bg-[#eef3e8]"
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}
