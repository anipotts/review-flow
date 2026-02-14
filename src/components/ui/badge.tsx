import { cn } from "@/lib/utils";

const variants = {
  pending: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
  sent: "bg-brand/10 text-brand border border-brand/20",
  opened: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  clicked: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
};

interface BadgeProps {
  status: keyof typeof variants;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize",
        variants[status],
        className
      )}
    >
      {status}
    </span>
  );
}
