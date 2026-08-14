export function SmartProfitIsotype({ className = "h-10 w-10" }) {
  return (
    <img
      src="/smartprofit-mark-clean.png"
      alt=""
      className={className}
      aria-hidden="true"
    />
  );
}

export function SmartProfitWordmark({ collapsed = false }) {
  if (collapsed) {
    return (
      <div className="flex items-center justify-center">
        <div className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-emerald-900/10">
          <SmartProfitIsotype className="h-10 w-10 object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <img
        src="/smartprofit-wordmark-clean.png"
        alt="SmartProfit"
        className="h-12 w-auto object-contain"
      />
    </div>
  );
}
