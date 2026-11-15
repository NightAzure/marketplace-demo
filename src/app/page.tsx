import { Suspense } from "react";
import { ItemGrid } from "@/components/marketplace/item-grid";
import { Skeleton } from "@/components/ui/skeleton";

function ItemGridFallback() {
  return (
    <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 sm:py-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40 bg-[#E2E8F0]" />
        <Skeleton className="h-9 w-48 rounded-xl bg-[#E2E8F0]" />
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white"
          >
            <Skeleton className="aspect-[4/3] w-full rounded-none bg-[#E2E8F0]" />
            <div className="space-y-2 p-3.5">
              <Skeleton className="h-5 w-20 bg-[#E2E8F0]" />
              <Skeleton className="h-4 w-full bg-[#E2E8F0]" />
              <Skeleton className="h-3 w-2/3 bg-[#E2E8F0]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<ItemGridFallback />}>
      <ItemGrid />
    </Suspense>
  );
}
