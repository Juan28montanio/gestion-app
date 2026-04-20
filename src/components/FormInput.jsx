import { useId } from "react";

export default function FormInput({
  label,
  hint,
  className = "",
  inputClassName = "",
  readOnly = false,
  multiline = false,
  rows = 5,
  id,
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const baseClasses =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5";
  const stateClasses = readOnly ? "bg-slate-50 text-slate-500" : "";

  return (
    <label className={`grid gap-2 text-sm text-slate-700 ${className}`} htmlFor={inputId}>
      <span className="font-medium text-slate-700">{label}</span>
      {multiline ? (
        <textarea
          id={inputId}
          rows={rows}
          readOnly={readOnly}
          className={`${baseClasses} ${stateClasses} ${inputClassName}`}
          {...props}
        />
      ) : (
        <input
          id={inputId}
          readOnly={readOnly}
          className={`${baseClasses} ${stateClasses} ${inputClassName}`}
          {...props}
        />
      )}
      {hint ? <span className="text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}
