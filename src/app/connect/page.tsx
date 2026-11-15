import { Suspense } from "react";
import type { Metadata } from "next";
import { ConnectStripeView } from "@/components/connect/connect-stripe-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Connect with Stripe | Mini-Marketplace",
  description:
    "Connect your Stripe account using your seller email to enable Buy Now checkout on your listings.",
};

function ConnectFallback() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-5">
      <Skeleton className="h-5 w-40 bg-[#E2E8F0]" />
      <Skeleton className="h-9 w-64 bg-[#E2E8F0]" />
      <Skeleton className="h-64 w-full rounded-2xl bg-[#E2E8F0]" />
    </div>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<ConnectFallback />}>
      <ConnectStripeView />
    </Suspense>
  );
}
