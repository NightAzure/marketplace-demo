import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { getListingById } from "@/lib/supabase/queries";
import { ItemDetailView } from "@/components/marketplace/item-detail-view";
import { Skeleton } from "@/components/ui/skeleton";

function ItemDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Skeleton className="mb-5 h-5 w-48" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Skeleton className="aspect-[4/3] w-full rounded-xl lg:col-span-7" />
        <div className="space-y-4 rounded-xl border border-[#DADDE1] bg-white p-6 lg:col-span-5">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

async function ItemDetailContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const { listing, error, status } = await getListingById(id);

  if (status === 503) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-[#DADDE1] bg-white p-6 text-center shadow-xs sm:p-8">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="size-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-[#1C1E21]">
            Supabase is not configured yet
          </h1>
          <p className="mt-2 text-sm text-[#65676B]">
            {error ||
              "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables to view marketplace listings."}
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#166FE5]"
            >
              <ArrowLeft className="size-4" />
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 404 || !listing) {
    notFound();
  }

  return (
    <ItemDetailView
      listing={listing}
      checkoutCanceled={resolvedSearchParams.canceled === "1"}
    />
  );
}

export default function ItemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ canceled?: string }>;
}) {
  return (
    <Suspense fallback={<ItemDetailSkeleton />}>
      <ItemDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
