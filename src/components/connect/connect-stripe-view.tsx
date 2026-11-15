"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  ShieldCheck,
  Store,
} from "lucide-react";
import { invalidateListingsCache } from "@/lib/marketplace-store";
import { PLATFORM_FEE_PERCENT } from "@/lib/stripe/constants";
import { connectStripeSchema, type SellerAccount } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ListingStats {
  total: number;
  available: number;
  sold: number;
}

interface ConnectStatusResponse {
  connected: boolean;
  onboarded: boolean;
  account: SellerAccount | null;
  listingStats?: ListingStats;
  alreadyOnboarded?: boolean;
  url?: string | null;
  error?: string;
}

export function ConnectStripeView() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const isReturn = searchParams.get("return") === "1";
  const isRefresh = searchParams.get("refresh") === "1";

  const [email, setEmail] = React.useState(initialEmail);
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isChecking, setIsChecking] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [statusData, setStatusData] =
    React.useState<ConnectStatusResponse | null>(null);

  const checkStatus = React.useCallback(async (targetEmail: string) => {
    const parsed = connectStripeSchema.safeParse({ email: targetEmail });
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message || "Enter a valid email.");
      return;
    }

    setEmailError(null);
    setServerError(null);
    setIsChecking(true);

    try {
      const res = await fetch(
        `/api/stripe/connect?email=${encodeURIComponent(parsed.data.email)}`,
        { cache: "no-store" }
      );
      const data = (await res.json().catch(() => ({}))) as ConnectStatusResponse;
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify Stripe status.");
      }

      setStatusData(data);
      if (data.onboarded) {
        invalidateListingsCache();
      }
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Could not check Stripe status."
      );
    } finally {
      setIsChecking(false);
    }
  }, []);

  React.useEffect(() => {
    if (!initialEmail || (!isReturn && !isRefresh)) {
      return;
    }

    const parsed = connectStripeSchema.safeParse({ email: initialEmail });
    if (!parsed.success) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function syncReturnedAccount(targetEmail: string) {
      try {
        const res = await fetch(
          `/api/stripe/connect?email=${encodeURIComponent(targetEmail)}`,
          { cache: "no-store", signal: controller.signal }
        );
        const data = (await res.json().catch(() => ({}))) as ConnectStatusResponse;
        if (cancelled) return;
        if (!res.ok) {
          setServerError(data.error || "Failed to verify Stripe status.");
          return;
        }
        setStatusData(data);
        if (data.onboarded) {
          invalidateListingsCache();
        }
      } catch (err) {
        if (cancelled || (err instanceof Error && err.name === "AbortError")) {
          return;
        }
        setServerError(
          err instanceof Error ? err.message : "Could not check Stripe status."
        );
      }
    }

    void syncReturnedAccount(parsed.data.email);
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [initialEmail, isReturn, isRefresh]);

  async function startOnboarding(force = false) {
    setServerError(null);
    const parsed = connectStripeSchema.safeParse({ email });
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message || "Enter a valid email.");
      return;
    }

    setEmailError(null);
    setIsConnecting(true);

    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data.email, force }),
      });

      const data = (await res.json().catch(() => ({}))) as ConnectStatusResponse;
      if (!res.ok) {
        throw new Error(
          data.error || "Failed to create Stripe onboarding link."
        );
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setStatusData({
        connected: true,
        onboarded: Boolean(data.account?.charges_enabled),
        account: data.account ?? null,
        listingStats: data.listingStats,
      });
      invalidateListingsCache();
      setIsConnecting(false);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Unable to connect with Stripe."
      );
      setIsConnecting(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void startOnboarding(false);
  }

  const account = statusData?.account ?? null;
  const isOnboarded = Boolean(statusData?.onboarded);
  const isIncomplete = Boolean(statusData?.connected && !statusData?.onboarded);

  return (
    <div className="animate-fade-up mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] transition-colors hover:text-[#1877F2]"
        >
          <ArrowLeft className="size-4" />
          Back to Marketplace
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#635BFF]">
          Stripe Connect · Seller Payouts
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
          Connect with Stripe
        </h1>
        <p className="mt-1.5 text-sm text-[#64748B] sm:text-[15px]">
          Enter the email you use on your listings to enable instant{" "}
          <strong className="font-semibold text-[#0F172A]">Buy Now</strong>{" "}
          checkout. Payments go directly to your Stripe account minus a{" "}
          {PLATFORM_FEE_PERCENT}% marketplace fee.
        </p>
      </div>

      {/* Refresh banner if user hit Stripe's expired link refresh URL */}
      {isRefresh && !isOnboarded && (
        <div
          role="status"
          className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <Clock className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Onboarding link expired or refreshed</p>
            <p className="mt-0.5 text-xs text-amber-800">
              Click &ldquo;Continue Stripe Onboarding&rdquo; below to generate a fresh link and finish setting up payouts.
            </p>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-8px_rgba(15,23,42,0.08)] sm:p-7">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="seller-connect-email" className="text-[#0F172A]">
              Seller Listing Email
            </Label>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#64748B]"
                  aria-hidden="true"
                />
                <Input
                  id="seller-connect-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                  }}
                  placeholder="seller@example.com"
                  className="h-11 pl-9"
                  aria-invalid={Boolean(emailError)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isChecking || isConnecting || !email.trim()}
                onClick={() => void checkStatus(email)}
                className="h-11 shrink-0 gap-1.5 rounded-xl border-[#E2E8F0] bg-[#F8FAFC] px-4 text-sm font-semibold text-[#0F172A] hover:bg-[#F1F5F9]"
              >
                {isChecking ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                <span>Check Status</span>
              </Button>
            </div>
            {emailError && (
              <p className="text-xs font-medium text-rose-600">{emailError}</p>
            )}
            <p className="text-xs text-[#64748B]">
              Every listing with this exact email automatically shows a{" "}
              <span className="font-semibold text-[#059669]">Buy Now</span>{" "}
              button once onboarding is complete.
            </p>
          </div>

          {!isOnboarded && (
            <Button
              type="submit"
              disabled={isConnecting || isChecking}
              className="h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-[#635BFF] to-[#4338CA] text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:from-[#5249F5] hover:to-[#3730A3] hover:shadow-md active:scale-[0.98]"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Redirecting to Stripe...</span>
                </>
              ) : (
                <>
                  <CreditCard className="size-4" />
                  <span>
                    {isIncomplete
                      ? "Continue Stripe Onboarding"
                      : "Connect with Stripe"}
                  </span>
                  <ExternalLink className="size-3.5 opacity-80" />
                </>
              )}
            </Button>
          )}
        </form>

        {/* Connected & Onboarded State */}
        {isOnboarded && account && (
          <div className="mt-6 space-y-5 border-t border-[#E2E8F0] pt-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-emerald-950">
                      Stripe Connected &amp; Ready for Payments
                    </h2>
                    <p className="mt-0.5 text-xs text-emerald-800">
                      All available listings for{" "}
                      <span className="font-semibold">{account.email}</span> now
                      accept instant Stripe Checkout.
                    </p>
                  </div>
                </div>
                <Badge className="border border-emerald-300 bg-white text-emerald-700 hover:bg-white">
                  Active
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl border border-emerald-200/80 bg-white px-3 py-2">
                  <p className="text-[11px] font-medium text-[#64748B]">
                    Connected Account
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs font-semibold text-[#0F172A]">
                    {account.stripe_account_id}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200/80 bg-white px-3 py-2">
                  <p className="text-[11px] font-medium text-[#64748B]">
                    Charges / Payouts
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-emerald-700">
                    {account.charges_enabled ? "Charges enabled" : "Pending"} ·{" "}
                    {account.payouts_enabled ? "Payouts enabled" : "Pending"}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200/80 bg-white px-3 py-2">
                  <p className="text-[11px] font-medium text-[#64748B]">
                    Your Listings
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-[#0F172A]">
                    {statusData?.listingStats?.available ?? 0} purchasable ·{" "}
                    {statusData?.listingStats?.sold ?? 0} sold
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  asChild
                  className="gap-1.5 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#2563EB] text-white hover:from-[#166FE5] hover:to-[#1D4ED8]"
                >
                  <Link href="/">
                    <Store className="size-4" />
                    <span>View Marketplace</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="gap-1.5 rounded-xl border-[#E2E8F0]"
                >
                  <Link href="/create/item">
                    <Plus className="size-4" />
                    <span>Post a Listing</span>
                  </Link>
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isConnecting}
                onClick={() => void startOnboarding(true)}
                className="gap-1.5 text-xs text-[#64748B] hover:text-[#0F172A]"
              >
                <ExternalLink className="size-3.5" />
                <span>Update Stripe details</span>
              </Button>
            </div>
          </div>
        )}

        {/* Incomplete State */}
        {isIncomplete && account && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 size-5 shrink-0 text-amber-600" />
              <div className="space-y-1 text-xs text-amber-900">
                <p className="text-sm font-bold">
                  Stripe onboarding not finished yet
                </p>
                <p>
                  Account{" "}
                  <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono">
                    {account.stripe_account_id}
                  </code>{" "}
                  was created, but charges are not enabled yet. Click{" "}
                  <strong>Continue Stripe Onboarding</strong> above to complete
                  verification.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* How it works footer */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#F5F3FF] text-[#635BFF]">
            <Mail className="size-4" />
          </div>
          <h3 className="font-display mt-2.5 text-sm font-bold text-[#0F172A]">
            1. Match by Email
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[#64748B]">
            No account login needed. Use the same email address you enter when creating listings.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#1877F2]">
            <ShieldCheck className="size-4" />
          </div>
          <h3 className="font-display mt-2.5 text-sm font-bold text-[#0F172A]">
            2. Hosted Onboarding
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[#64748B]">
            Complete verification securely on Stripe&apos;s hosted onboarding flow in sandbox mode.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CreditCard className="size-4" />
          </div>
          <h3 className="font-display mt-2.5 text-sm font-bold text-[#0F172A]">
            3. Instant Buy Now
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[#64748B]">
            Buyers pay on your connected account; the marketplace keeps {PLATFORM_FEE_PERCENT}% and marks items Sold.
          </p>
        </div>
      </div>
    </div>
  );
}
