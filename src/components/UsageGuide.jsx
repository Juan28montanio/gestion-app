import { ArrowRight, BookOpenCheck, ChefHat, CircleDollarSign, PackageSearch, Store, UserCog2 } from "lucide-react";

const START_STEPS = [
  {
    id: "account",
    title: "1. Ajusta tu negocio",
    description:
      "Empieza por nombre del negocio, responsable visible y logo. Asi todo lo que imprimas o consultes sale con identidad clara.",
    action: "Ir a Cuenta",
    icon: UserCog2,
  },
  {
    id: "resources",
    title: "2. Carga insumos, proveedores y compras",
    description:
      "Antes de crear platos, registra los insumos base y al menos una compra real. Eso evita costos inventados.",
    action: "Ir a Recursos",
    icon: PackageSearch,
  },
  {
    id: "inventory",
    title: "3. Crea productos de venta",
    description:
      "Primero define lo que vas a vender. Luego conecta cada producto con ficha tecnica directa o con preparaciones base.",
    action: "Ir a Productos",
    icon: Store,
  },
  {
    id: "salon",
    title: "4. Organiza tus mesas",
    description:
      "Si trabajas con salon, crea o ajusta las mesas antes del primer servicio para que POS y cobro fluyan sin friccion.",
    action: "Ir a Salon",
    icon: ChefHat,
  },
  {
    id: "pos",
    title: "5. Empieza a vender",
    description:
      "Con productos, costos y mesas listos, ya puedes tomar pedidos y cobrar con una lectura mas limpia.",
    action: "Ir a Punto de venta",
    icon: CircleDollarSign,
  },
];

const DAILY_FLOW = [
  "Abre caja antes del primer cobro.",
  "Registra compras el mismo dia para que el costo conectado no se atrase.",
  "Crea fichas tecnicas solo despues de tener insumos y compras reales.",
  "Usa preparaciones base para platos compuestos como almuerzos, combos o menus del dia.",
  "Revisa caja y finanzas al final de la jornada, no solo cuando haya un problema.",
];

const COMMON_MISTAKES = [
  "Crear productos antes de tener insumos y compras.",
  "Usar fichas tecnicas directas para platos compuestos que en realidad dependen de preparaciones base.",
  "Cobrar sin caja abierta y luego intentar cuadrar al final.",
  "Dejar clientes, ticketeras o deudas sin nombre claro.",
];

function GuideCard({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          {actionLabel ? (
            <button
              type="button"
              onClick={onAction}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              {actionLabel}
              <ArrowRight size={15} />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function UsageGuide({ business, onNavigate }) {
  return (
    <section className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_52%,#eef2ff_100%)] px-6 py-6 shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Guia de uso
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-slate-950">
              La forma mas clara de empezar bien con {business?.name || "SmartProfit"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Esta guia esta pensada para cualquier persona del negocio. Si sigues este orden,
              la app queda mejor organizada, los costos salen mas reales y el cobro diario se
              vuelve mas facil.
            </p>
          </div>

          <article className="rounded-[24px] border border-slate-200 bg-white/80 p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Recomendacion clave
            </p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              No empieces por vender. Empieza por ordenar la base del negocio.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Primero cuenta, luego recursos, despues productos y al final POS. Asi el sistema te
              ayuda de verdad.
            </p>
          </article>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {START_STEPS.map((step) => (
          <GuideCard
            key={step.id}
            icon={step.icon}
            title={step.title}
            description={step.description}
            actionLabel={step.action}
            onAction={() => onNavigate(step.id)}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
              <BookOpenCheck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Rutina diaria recomendada</h3>
              <p className="mt-1 text-sm text-slate-500">
                Una forma simple de operar sin desgastarte.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {DAILY_FLOW.map((item, index) => (
              <div
                key={item}
                className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200"
              >
                <span className="font-semibold text-slate-950">{index + 1}.</span> {item}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">Errores comunes que conviene evitar</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Estos son los fallos que mas suelen confundir a los negocios cuando arrancan.
          </p>
          <div className="mt-5 grid gap-3">
            {COMMON_MISTAKES.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
