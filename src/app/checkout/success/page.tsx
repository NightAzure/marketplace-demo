import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckoutSuccessView } from "@/components/checkout/checkout-success-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Order Confirmation | Mini-Marketplace",
  description: "Your Stripe Connect order confirmation and receipt.",
};

function CheckoutSuccessFallback() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 space-y-5">
      <Skeleton className="h-5 w-40 bg-[#E2E8F0]" />
      <Skeleton className="h-72 w-full rounded-2xl bg-[#E2E8F0]" />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessFallback />}>
      <CheckoutSuccessView />
    </Suspense>
  );
}
