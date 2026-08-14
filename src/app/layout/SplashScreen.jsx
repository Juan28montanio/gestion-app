export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#f6f7f2] px-6">
      <div className="w-full max-w-lg rounded-lg border border-[#d8ddcf] bg-white px-8 py-10 text-center shadow-[0_18px_60px_rgba(15,23,42,0.10)]">
        <div className="mx-auto flex w-full justify-center">
          <img
            src="/smartprofit_logo.png"
            alt="SmartProfit"
            className="h-28 w-auto object-contain"
          />
        </div>
        <h1 className="mt-6 text-3xl font-black tracking-[-0.03em] text-slate-950">
          Preparando tu espacio de trabajo
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Estamos cargando el negocio, la caja y la informacion operativa.
        </p>
      </div>
    </div>
  );
}
