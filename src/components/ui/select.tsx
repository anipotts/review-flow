import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({
  label,
  error,
  className,
  id,
  children,
  ...props
}: SelectProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink-secondary mb-1.5">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          "w-full px-3 py-2.5 border rounded-lg text-sm bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand min-h-[44px] transition-colors",
          error ? "border-red-400" : "border-edge",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
