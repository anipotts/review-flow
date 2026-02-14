import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-brand text-[#0B0E14] font-semibold hover:bg-brand-dark active:bg-[#009DB0]",
  secondary:
    "bg-surface text-ink-secondary border border-edge hover:bg-surface-hover active:bg-surface-active",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  ghost: "text-ink-secondary hover:bg-surface-hover active:bg-surface-active",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none min-h-[44px]",
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
