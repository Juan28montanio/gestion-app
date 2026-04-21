import { Lightbulb, PanelRightClose, Sparkles } from "lucide-react";
import { useEffect } from "react";

export default function DecisionCenterDrawer({ open, currentEntry, onClose }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const items = Array.isArray(currentEntry?.items) ? currentEntry.items : [];

  return (
    <div className="fixed inset-0 z-[120]">
      <div
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="absolute inset-x-0 bottom-0 flex max-h-[88vh] min-h-[56vh] flex-col rounded-t-[28px] border border-slate-200 bg-white shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:min-h-0 md:w-full md:max-w-[430px] md:rounded-none md:rounded-l-[28px] md:border-y-0 md:border-r-0 xl:max-w-[500px]">
        <div className="flex justify-center pt-3 md:hidden">
          <span className="h-1.5 w-14 rounded-full bg-slate-200" />
        </div>

        <div className="border-b border-slate-200 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                {currentEntry?.eyebrow || "Centro de decisiones"}
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-slate-950 md:text-2xl">
                {currentEntry?.title || "Recomendaciones del sistema"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {currentEntry?.summary ||
                  "Aqui veras alertas, focos operativos y decisiones sugeridas sin sobrecargar la pantalla principal."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
            >
              <PanelRightClose size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5 md:py-5">
          {items.length ? (
            <div className="grid gap-4">
              {items.map((item) => (
                <article
                  key={`${item.title}-${item.body}`}
                  className={`rounded-[24px] p-4 ring-1 ${
                    item.tone || "bg-slate-50 text-slate-900 ring-slate-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-current ring-1 ring-black/5">
                      {item.icon === "sparkles" ? <Sparkles size={16} /> : <Lightbulb size={16} />}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 opacity-90">{item.body}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500">
              Todavia no hay recomendaciones publicadas para este modulo.
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-4 py-4 md:hidden">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Volver al modulo
          </button>
        </div>
      </aside>
    </div>
  );
}
