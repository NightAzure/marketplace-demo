"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Package,
  Receipt,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { formatPrice, maskEmail } from "@/lib/format";
import { invalidateListingsCache } from "@/lib/marketplace-store";
import { PLATFORM_FEE_PERCENT } from "@/lib/stripe/constants";
import type { Listing, Order } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface StripeSessionSummary {
  id: string;
  payment_status: string;
  amount_total: number;
  platform_fee_cents: number;
  seller_payout_cents: number;
  buyer_email: string | null;
  payment_intent_id: string | null;
  currency: string;
}

interface OrderStatusResponse {
  listing?: Listing;
  order?: Order | null;
  stripeSession?: StripeSessionSummary | null;
  webhookConfirmed?: boolean;
  error?: string;
}

export function CheckoutSuccessView() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id")?.trim() ?? "";
  const listingId = searchParams.get("listing_id")?.trim() ?? "";

  const missingParams = !sessionId || !listingId;
  const [data, setData] = React.useState<OrderStatusResponse | null>(null);
  const [error, setError] = React.useState<string | null>(
    missingParams ? "Missing checkout session or listing reference in URL." : null
  );
  const [isLoading, setIsLoading] = React.useState(!missingParams);
  const [isPolling, setIsPolling] = React.useState(false);

  const fetchOrderStatus = React.useCallback(async () => {
    const res = await fetch(
      `/api/stripe/order-status?session_id=${encodeURIComponent(sessionId)}&listing_id=${encodeURIComponent(listingId)}`,
      { cache: "no-store" }
    );
    const json = (await res.json().catch(() => ({}))) as OrderStatusResponse;
    if (!res.ok) {
      throw new Error(json.error || "Failed to load order confirmation.");
    }
    return json;
  }, [sessionId, listingId]);

  React.useEffect(() => {
    invalidateListingsCache();
  }, []);

  React.useEffect(() => {
    if (missingParams) {
      return;
    }

    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;

    async function load(attempt: number) {
      try {
        const result = await fetchOrderStatus();
        if (cancelled) return;

        setData(result);
        setError(null);
        setIsLoading(false);
        invalidateListingsCache();

        const isPaidSession = result.stripeSession?.payment_status === "paid";
        if (!result.webhookConfirmed && isPaidSession && attempt < 8) {
          setIsPolling(true);
          pollTimer = setTimeout(() => {
            void load(attempt + 1);
          }, 1500);
        } else {
          setIsPolling(false);
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Unable to load order details."
        );
        setIsLoading(false);
        setIsPolling(false);
      }
    }

    void load(0);

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [missingParams, fetchOrderStatus]);

  async function handleManualRefresh() {
    setIsPolling(true);
    try {
      const result = await fetchOrderStatus();
      setData(result);
      setError(null);
      invalidateListingsCache();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to refresh order status."
      );
    } finally {
      setIsPolling(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 space-y-5">
        <Skeleton className="h-5 w-40 bg-[#E2E8F0]" />
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-4">
          <Skeleton className="h-12 w-12 rounded-full bg-[#E2E8F0]" />
          <Skeleton className="h-7 w-64 bg-[#E2E8F0]" />
          <Skeleton className="h-24 w-full rounded-xl bg-[#E2E8F0]" />
          <Skeleton className="h-32 w-full rounded-xl bg-[#E2E8F0]" />
        </div>
      </div>
    );
  }

  if (error || !data?.listing) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-center shadow-xs sm:p-8">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="font-display mt-4 text-xl font-bold text-[#0F172A]">
            Could not verify order
          </h1>
          <p className="mt-2 text-sm text-[#64748B]">
            {error || "We could not locate this checkout session."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild className="rounded-xl bg-[#1877F2] text-white">
              <Link href="/">Back to Marketplace</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { listing, order, stripeSession, webhookConfirmed } = data;
  const amountCents =
    order?.amount_cents ??
    stripeSession?.amount_total ??
    Math.round(listing.price * 100);
  const feeCents =
    order?.platform_fee_cents ?? stripeSession?.platform_fee_cents ?? 0;
  const payoutCents =
    order?.seller_payout_cents ??
    stripeSession?.seller_payout_cents ??
    Math.max(0, amountCents - feeCents);
  const isPaid =
    order?.status === "paid" || stripeSession?.payment_status === "paid";

  return (
    <div className="animate-fade-up mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] transition-colors hover:text-[#1877F2]"
        >
          <ArrowLeft className="size-4" />
          Back to Marketplace
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04),0_10px_28px_-8px_rgba(15,23,42,0.1)]">
        {/* Top Confirmation Banner */}
        <div className="border-b border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-[#EAF2FF]/60 p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  {isPaid ? "Payment Succeeded" : "Checkout Status"}
                </p>
                <h1 className="font-display mt-0.5 text-2xl font-bold tracking-tight text-[#0F172A]">
                  {webhookConfirmed
                    ? "Order Confirmed!"
                    : isPaid
                      ? "Payment Received!"
                      : "Pending Confirmation"}
                </h1>
                <p className="mt-1 text-sm text-[#475569]">
                  {webhookConfirmed
                    ? "Your order has been saved and this listing is now marked as Sold."
                    : isPaid
                      ? "Payment received. Finalizing your order details..."
                      : "We are checking your payment status."}
                </p>
              </div>
            </div>

            <Badge
              className={
                listing.status === "sold"
                  ? "bg-slate-900 text-white hover:bg-slate-900"
                  : "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50"
              }
            >
              {listing.status === "sold" ? "Listing Sold" : "Syncing Status"}
            </Badge>
          </div>

          {!webhookConfirmed && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3.5 py-2.5 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                {isPolling ? (
                  <Loader2 className="size-3.5 animate-spin text-amber-700" />
                ) : (
                  <Clock className="size-3.5 text-amber-700" />
                )}
                <span>
                  {isPolling
                    ? "Finalizing order confirmation..."
                    : "Order confirmation is taking a moment longer than usual. Click refresh to check again."}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleManualRefresh()}
                disabled={isPolling}
                className="h-7 gap-1 border-amber-300 bg-white px-2.5 text-xs text-amber-900 hover:bg-amber-50"
              >
                <RefreshCw className="size-3" />
                Refresh
              </Button>
            </div>
          )}
        </div>

        {/* Item Summary */}
        <div className="space-y-6 p-6 sm:p-7">
          <div className="flex items-center gap-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
              {listing.image_url ? (
                <img
                  src={listing.image_url}
                  alt={listing.title}
                  className="size-full object-cover"
                />
              ) : (
                <Package className="size-6 text-[#64748B]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-base font-bold text-[#0F172A]">
                  {listing.title}
                </p>
                {listing.status === "sold" && (
                  <Badge className="bg-slate-900 text-[10px] text-white hover:bg-slate-900">
                    Sold
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-[#64748B]">
                {listing.category} · {listing.location}
              </p>
              <p className="mt-1 text-xs text-[#64748B]">
                Seller: {maskEmail(listing.seller_email)}
              </p>
            </div>
          </div>

          {/* Receipt Breakdown */}
          <div className="space-y-3 rounded-xl border border-[#E2E8F0] bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#64748B]">
              <Receipt className="size-3.5 text-[#1877F2]" />
              <span>Order Summary</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Item price paid</span>
                <span className="font-bold tabular-nums text-[#0F172A]">
                  {formatPrice(amountCents / 100)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">
                  Marketplace fee ({PLATFORM_FEE_PERCENT}%)
                </span>
                <span className="font-medium tabular-nums text-[#475569]">
                  {formatPrice(feeCents / 100)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">
                  Routed to seller&apos;s connected account
                </span>
                <span className="font-semibold tabular-nums text-emerald-700">
                  {formatPrice(payoutCents / 100)}
                </span>
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] pt-3 space-y-1.5 text-xs text-[#64748B]">
              {order?.id && (
                <div className="flex items-center justify-between gap-2">
                  <span>Order ID</span>
                  <code className="font-mono text-[11px] text-[#0F172A]">
                    {order.id}
                  </code>
                </div>
              )}
              {(order?.buyer_email || stripeSession?.buyer_email) && (
                <div className="flex items-center justify-between gap-2">
                  <span>Receipt Email</span>
                  <span className="font-medium text-[#0F172A]">
                    {order?.buyer_email || stripeSession?.buyer_email}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <span>Stripe Session</span>
                <code className="truncate max-w-[240px] font-mono text-[11px] text-[#0F172A]">
                  {sessionId}
                </code>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/50 px-3.5 py-2.5 text-xs text-emerald-900">
            <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
            <span>
              Payment processed securely via Stripe.
            </span>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button
              asChild
              className="h-10 flex-1 gap-1.5 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#2563EB] text-white hover:from-[#166FE5] hover:to-[#1D4ED8]"
            >
              <Link href={`/item/${listing.id}`}>
                <span>View Listing</span>
                <ExternalLink className="size-3.5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-10 flex-1 rounded-xl border-[#E2E8F0]"
            >
              <Link href="/">Browse More Items</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
