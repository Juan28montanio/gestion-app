export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#f4f6f8] px-6">
      <div className="w-full max-w-lg rounded-[32px] border border-slate-200 bg-white px-8 py-10 text-center shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex w-full justify-center">
          <img
            src="/smartprofit_logo.png"
            alt="SmartProfit"
            className="h-24 w-auto object-contain"
          />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          SmartProfit
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
          Preparando tu espacio de trabajo
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Estamos cargando el negocio, la caja y la informacion operativa.
        </p>
      </div>
    </div>
  );
}
