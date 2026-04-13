export default function FormInput({
  label,
  hint,
  className = "",
  inputClassName = "",
  readOnly = false,
  multiline = false,
  rows = 5,
  ...props
}) {
  const baseClasses =
    "w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-emerald-500";
  const stateClasses = readOnly ? "bg-slate-50 text-slate-500" : "";

  return (
    <label className={`grid gap-2 text-sm font-medium text-slate-700 ${className}`}>
      <span>{label}</span>
      {multiline ? (
        <textarea
          rows={rows}
          readOnly={readOnly}
          className={`${baseClasses} ${stateClasses} ${inputClassName}`}
          {...props}
        />
      ) : (
        <input
          readOnly={readOnly}
          className={`${baseClasses} ${stateClasses} ${inputClassName}`}
          {...props}
        />
      )}
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}
