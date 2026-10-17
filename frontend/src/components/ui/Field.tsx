import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

export const inputClass =
  "h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 text-sm text-ink placeholder:text-faint " +
  "transition-colors hover:border-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({ label, hint, error, id, className, ...props }: TextFieldProps) {
  const inputId = id ?? props.name;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1 flex items-baseline justify-between text-[13px] font-medium text-ink-soft">
        {label}
        {hint && <span className="text-xs font-normal text-faint">{hint}</span>}
      </label>
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={clsx(inputClass, error && "border-danger focus:border-danger focus:ring-danger/15")}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
