import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-neutral-50/60 pb-20 pt-8">
      <div className="container mx-auto px-4 max-w-5xl space-y-8">
        {/* User Card Skeleton */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 flex flex-col sm:flex-row items-center gap-6">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="space-y-2 text-center sm:text-left flex-1">
            <Skeleton className="h-6 w-48 rounded-lg mx-auto sm:mx-0" />
            <Skeleton className="h-4 w-32 rounded mx-auto sm:mx-0" />
            <Skeleton className="h-5 w-20 rounded-full mx-auto sm:mx-0" />
          </div>
        </div>

        {/* Content Tabs Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-3">
            <Skeleton className="h-10 w-full rounded-2xl" />
            <Skeleton className="h-10 w-full rounded-2xl" />
            <Skeleton className="h-10 w-full rounded-2xl" />
          </div>
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
