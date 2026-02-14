import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-brand", className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-surface-hover rounded", className)} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
