import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateItemForm } from "@/components/marketplace/create-item-form";
import { Skeleton } from "@/components/ui/skeleton";

function CreateItemFormFallback() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6 lg:col-span-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 lg:col-span-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-4 h-80 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export default function CreateItemPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5">
        <Link
          href="/create"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] transition-colors hover:text-[#1877F2]"
        >
          <ArrowLeft className="size-4" />
          Back to listing types
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
          Item for Sale
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Fill in your item details on the left and watch your Marketplace
          preview update live.
        </p>
      </div>

      <Suspense fallback={<CreateItemFormFallback />}>
        <CreateItemForm />
      </Suspense>
    </div>
  );
}
