import { Skeleton } from "@/components/ui/loading";

export default function DashboardLoading() {
  return (
    <div>
      <Skeleton className="h-7 sm:h-8 w-36 sm:w-48 mb-4 sm:mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-surface rounded-xl border border-edge px-4 py-3 sm:p-6"
          >
            <Skeleton className="h-3 sm:h-4 w-20 sm:w-24 mb-2" />
            <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
          </div>
        ))}
      </div>
      <div className="bg-surface rounded-xl border border-edge p-4 sm:p-6">
        <Skeleton className="h-5 sm:h-6 w-28 sm:w-36 mb-4" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full mb-2" />
        ))}
      </div>
    </div>
  );
}
