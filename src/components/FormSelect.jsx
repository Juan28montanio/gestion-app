import { useId } from "react";

export default function FormSelect({
  label,
  hint,
  className = "",
  selectClassName = "",
  options = [],
  children,
  id,
  ...props
}) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <label className={`grid gap-2 text-sm text-slate-700 ${className}`} htmlFor={selectId}>
      <span className="font-medium text-slate-700">{label}</span>
      <select
        id={selectId}
        className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 ${selectClassName}`}
        {...props}
      >
        {children ||
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
      </select>
      {hint ? <span className="text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}
