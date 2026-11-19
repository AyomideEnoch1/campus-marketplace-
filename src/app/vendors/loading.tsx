import { Skeleton } from "@/components/ui/skeleton";

export default function VendorsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20 pt-8">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        <div className="space-y-2 text-center max-w-xl mx-auto">
          <Skeleton className="h-8 w-64 rounded-xl mx-auto" />
          <Skeleton className="h-4 w-96 rounded-lg mx-auto" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-neutral-200/80 p-6 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-14 h-14 rounded-2xl" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-5 w-32 rounded-lg" />
                  <Skeleton className="h-3.5 w-24 rounded" />
                </div>
              </div>
              <Skeleton className="h-4 w-full rounded" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
