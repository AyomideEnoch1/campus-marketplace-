import { Skeleton } from "@/components/ui/skeleton";

export default function CampusesLoading() {
  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20 pt-8">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        <div className="space-y-2 text-center max-w-xl mx-auto">
          <Skeleton className="h-8 w-64 rounded-xl mx-auto" />
          <Skeleton className="h-4 w-96 rounded-lg mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-neutral-200/80 p-6 space-y-4">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-6 w-36 rounded-lg" />
              <Skeleton className="h-4 w-full rounded" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
