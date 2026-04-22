import { useId } from "react";

export default function FormSelect({
  label,
  hint,
  labelNote,
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
      <span className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <span className="min-w-0 font-medium text-slate-700">
          {label}
          {props.required ? <span className="ml-1 text-rose-500">*</span> : null}
        </span>
        {labelNote ? (
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400 sm:text-right">
            {labelNote}
          </span>
        ) : null}
      </span>
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
