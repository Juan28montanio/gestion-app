export default function FormSelect({
  label,
  hint,
  className = "",
  selectClassName = "",
  options = [],
  children,
  ...props
}) {
  return (
    <label className={`grid gap-2 text-sm font-medium text-slate-700 ${className}`}>
      <span>{label}</span>
      <select
        className={`w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-emerald-500 ${selectClassName}`}
        {...props}
      >
        {children ||
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
      </select>
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}
