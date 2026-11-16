import { Skeleton, ProductCardSkeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20">
      {/* Header Banner Skeleton */}
      <div className="bg-white border-b border-neutral-200/80 py-8 px-4">
        <div className="container mx-auto max-w-7xl space-y-4">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
          <div className="flex gap-2 pt-2 overflow-x-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
            ))}
          </div>
        </div>
      </div>

      {/* Grid Content Skeleton */}
      <div className="container mx-auto max-w-7xl px-4 pt-8">
        <div className="flex items-center justify-between pb-6">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-9 w-40 rounded-xl" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
