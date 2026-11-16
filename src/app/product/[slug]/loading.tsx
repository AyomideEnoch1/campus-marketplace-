import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-white pb-20 pt-6">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-4 w-16 rounded" />
          <span className="text-neutral-300">/</span>
          <Skeleton className="h-4 w-24 rounded" />
          <span className="text-neutral-300">/</span>
          <Skeleton className="h-4 w-36 rounded" />
        </div>

        {/* Product Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery Skeleton */}
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-3xl" />
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-2xl shrink-0" />
              ))}
            </div>
          </div>

          {/* Details Skeleton */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-9 w-3/4 rounded-xl" />
              <Skeleton className="h-7 w-36 rounded-lg" />
            </div>

            <Skeleton className="h-24 w-full rounded-2xl" />

            {/* Vendor Card Skeleton */}
            <div className="rounded-2xl border border-neutral-200/80 p-4 flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-48 rounded" />
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex gap-3 pt-4">
              <Skeleton className="h-12 flex-1 rounded-2xl" />
              <Skeleton className="h-12 w-14 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
