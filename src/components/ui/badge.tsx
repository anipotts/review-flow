import { cn } from "@/lib/utils";

const variants = {
  pending: "bg-yellow-100 text-yellow-800",
  sent: "bg-blue-100 text-blue-800",
  opened: "bg-purple-100 text-purple-800",
  clicked: "bg-green-100 text-green-800",
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
