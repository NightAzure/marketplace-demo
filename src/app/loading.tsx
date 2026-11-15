import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 sm:py-5 space-y-4">
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-8 w-24 shrink-0 rounded-full bg-[#E4E6EB]"
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-44 bg-[#E4E6EB]" />
        <Skeleton className="h-9 w-48 bg-[#E4E6EB]" />
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-xl border border-[#DADDE1]/80 bg-white"
          >
            <Skeleton className="aspect-[4/3] w-full rounded-none bg-[#E4E6EB]" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-5 w-20 bg-[#E4E6EB]" />
              <Skeleton className="h-4 w-full bg-[#E4E6EB]" />
              <Skeleton className="h-3 w-2/3 bg-[#E4E6EB]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
