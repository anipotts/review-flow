import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink-secondary mb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "w-full px-3 py-2.5 border rounded-lg text-sm bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand min-h-[44px] transition-colors",
          error ? "border-red-400" : "border-edge",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-xs text-ink-muted">{helperText}</p>
      )}
    </div>
  );
}
