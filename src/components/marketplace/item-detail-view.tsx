"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  Armchair,
  ArrowLeft,
  BookOpen,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  Gamepad2,
  Home,
  ImageOff,
  Laptop,
  Lock,
  MailCheck,
  MapPin,
  Share2,
  ShieldCheck,
  Shirt,
  Sparkles,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { getCategoryByName, type CategoryItem } from "@/lib/constants/categories";
import { formatPrice, formatRelativeTime, maskEmail } from "@/lib/format";
import {
  MIN_STRIPE_PRICE_USD,
  PLATFORM_FEE_PERCENT,
} from "@/lib/stripe/constants";
import type { Listing } from "@/lib/types";
import { BuyNowButton } from "@/components/marketplace/buy-now-button";
import {
  MessageSellerDialog,
  QUICK_INQUIRY_STARTERS,
} from "@/components/marketplace/message-seller-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<CategoryItem["iconName"], LucideIcon> = {
  Laptop,
  Car,
  Armchair,
  Shirt,
  Home,
  Gamepad2,
  Dumbbell,
  BookOpen,
  Sparkles,
  Tag,
};

interface ItemDetailViewProps {
  listing: Listing;
  checkoutCanceled?: boolean;
}

export function ItemDetailView({
  listing,
  checkoutCanceled = false,
}: ItemDetailViewProps) {
  const categoryMeta = getCategoryByName(listing.category);
  const categorySlug = categoryMeta?.slug ?? "other";
  const CategoryIcon = CATEGORY_ICONS[categoryMeta?.iconName ?? "Tag"];
  const isFree = listing.price === 0;
  const isSold = listing.status === "sold";
  const canBuyNow =
    !isSold &&
    listing.seller_onboarded &&
    listing.price >= MIN_STRIPE_PRICE_USD;

  const [copied, setCopied] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [starterMessage, setStarterMessage] = React.useState<string | undefined>(
    undefined
  );

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  }

  function handleQuickChipClick(text: string) {
    setStarterMessage(text);
    setDialogOpen(true);
  }

  return (
    <div className="animate-fade-up mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-7 min-[1180px]:max-w-6xl min-[1180px]:py-8">
      {/* Top Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-medium text-[#64748B] transition-colors hover:text-[#1877F2]"
          >
            <ArrowLeft className="size-4 shrink-0" />
            Back to Marketplace
          </Link>
          <ChevronRight className="size-4 shrink-0 text-[#94A3B8]" />
          <Link
            href={`/category/${categorySlug}`}
            className="truncate font-medium text-[#1877F2] hover:underline"
          >
            {listing.category}
          </Link>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="shrink-0 gap-1.5 rounded-xl border-[#E2E8F0] bg-white text-xs font-medium text-[#0F172A] shadow-xs transition-all duration-150 hover:bg-[#F8FAFC] active:scale-[0.98]"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-600" />
              Link copied!
            </>
          ) : (
            <>
              <Share2 className="size-3.5" />
              Copy link
            </>
          )}
        </Button>
      </div>

      {/* Responsive Balanced Layout: Single-column until 1180px (when sidebar + 2-col fit cleanly) */}
      <div className="grid grid-cols-1 gap-5 min-[1180px]:grid-cols-12 min-[1180px]:items-start min-[1180px]:gap-6">
        {/* Left Row 1: High-Contrast Gallery Showcase */}
        <div className="relative min-w-0 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#0B1120] shadow-[0_1px_3px_rgba(15,23,42,0.06),0_10px_25px_-8px_rgba(15,23,42,0.16)] ring-1 ring-slate-900/10 min-[1180px]:col-span-7 min-[1180px]:col-start-1 min-[1180px]:row-start-1">
          {isSold && (
            <div className="absolute top-3.5 left-3.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md ring-1 ring-white/15 backdrop-blur-xs">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              Sold
            </div>
          )}
          <div className="flex aspect-[4/3] max-h-[460px] w-full items-center justify-center">
            {listing.image_url ? (
              <img
                src={listing.image_url}
                alt={listing.title}
                className={cn(
                  "max-h-full max-w-full object-contain transition-transform duration-500 ease-out hover:scale-[1.02]",
                  isSold && "opacity-70 grayscale-[35%]"
                )}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2.5 p-8 text-center text-slate-400">
                <div className="flex size-14 items-center justify-center rounded-full bg-slate-900 ring-1 ring-slate-800">
                  <ImageOff className="size-7" />
                </div>
                <p className="text-sm font-medium text-slate-300">
                  No photo provided
                </p>
                <p className="text-xs text-slate-500">
                  Message the seller if you would like more details or photos.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sticky Column (Row 2 on stacked screens): Title, Price, Seller & CTA */}
        <div className="min-w-0 space-y-5 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_6px_20px_-6px_rgba(15,23,42,0.06)] sm:p-6 min-[1180px]:sticky min-[1180px]:top-20 min-[1180px]:col-span-5 min-[1180px]:col-start-8 min-[1180px]:row-span-2 min-[1180px]:row-start-1">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h1 className="font-display break-words text-xl font-bold leading-snug tracking-tight text-[#0F172A] sm:text-2xl">
                {listing.title}
              </h1>
              {isSold && (
                <Badge className="shrink-0 bg-slate-900 text-white hover:bg-slate-900">
                  Sold
                </Badge>
              )}
            </div>
            <p
              className={cn(
                "font-display mt-1.5 text-2xl font-extrabold tabular-nums sm:text-[26px]",
                isSold
                  ? "text-[#64748B] line-through"
                  : isFree
                    ? "text-emerald-600"
                    : "text-[#0F172A]"
              )}
            >
              {formatPrice(listing.price)}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs text-[#64748B]">
              <Link href={`/category/${categorySlug}`}>
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1.5 border font-medium transition-opacity hover:opacity-85",
                    categoryMeta?.pillClass ??
                      "border-[#E2E8F0] bg-[#EAF2FF] text-[#1877F2]"
                  )}
                >
                  <CategoryIcon
                    className={cn(
                      "size-3",
                      categoryMeta?.badgeText ?? "text-[#1877F2]"
                    )}
                  />
                  {listing.category}
                </Badge>
              </Link>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" />
                {listing.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5 shrink-0" />
                Listed {formatRelativeTime(listing.created_at)}
              </span>
            </div>
          </div>

          <Separator className="bg-[#E2E8F0]" />

          {/* Seller Information Panel */}
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  Seller Information
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-[#0F172A]">
                  {maskEmail(listing.seller_email)}
                </p>
              </div>
              <Badge className="gap-1 border border-emerald-200/80 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                <MailCheck className="size-3.5 text-emerald-600" />
                Direct email alerts active
              </Badge>
            </div>
          </div>

          {/* Checkout / Buy Now Section */}
          {checkoutCanceled && !isSold && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <span>
                Stripe Checkout was canceled. You have not been charged.
              </span>
            </div>
          )}

          {isSold ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">
                    This item has been sold
                  </p>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    Payment was confirmed via Stripe and this listing is no longer available to purchase.
                  </p>
                </div>
              </div>
            </div>
          ) : canBuyNow ? (
            <div className="space-y-2">
              <BuyNowButton
                listingId={listing.id}
                price={listing.price}
                variant="detail"
              />
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#64748B]">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                <span>
                  Powered by Stripe Connect · {PLATFORM_FEE_PERCENT}% platform fee included
                </span>
              </p>
            </div>
          ) : isFree || listing.price < MIN_STRIPE_PRICE_USD ? (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3.5 py-2.5 text-xs text-emerald-800">
              Free or under-$0.50 item — message the seller below to arrange pickup.
            </div>
          ) : (
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
              <div className="flex items-start gap-2.5">
                <Lock className="mt-0.5 size-4 shrink-0 text-[#64748B]" />
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-[#0F172A]">
                    Online checkout unavailable
                  </p>
                  <p className="text-[#64748B]">
                    This seller hasn&apos;t connected their Stripe account yet, so Buy Now is disabled.
                  </p>
                  <Link
                    href="/connect"
                    className="inline-block font-semibold text-[#1877F2] hover:underline"
                  >
                    Are you the seller? Connect with Stripe →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Primary Message CTA + Quick-Inquiry Chips */}
          <div className="space-y-3">
            <MessageSellerDialog
              listing={listing}
              open={dialogOpen}
              onOpenChange={(next) => {
                setDialogOpen(next);
                if (!next) setStarterMessage(undefined);
              }}
              initialMessage={starterMessage}
              triggerClassName={
                canBuyNow
                  ? "bg-none bg-[#EAF2FF] text-[#1466D8] border border-[#1877F2]/20 shadow-none hover:bg-[#DCEAFE] hover:shadow-xs"
                  : undefined
              }
            />

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-[#64748B]">
                Quick-send an inquiry:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_INQUIRY_STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => handleQuickChipClick(starter)}
                    className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-left text-xs font-medium text-[#0F172A] transition-all duration-150 hover:border-[#1877F2]/50 hover:bg-[#EAF2FF] hover:text-[#1877F2] active:scale-[0.98]"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Left Row 2: Dedicated Description Card */}
        <section className="min-w-0 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_6px_20px_-6px_rgba(15,23,42,0.06)] sm:p-6 min-[1180px]:col-span-7 min-[1180px]:col-start-1 min-[1180px]:row-start-2">
          <h2 className="font-display text-base font-bold tracking-tight text-[#0F172A]">
            About this item
          </h2>
          <p className="mt-2.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[#334155]">
            {listing.description?.trim()
              ? listing.description
              : "No additional description provided by the seller."}
          </p>
        </section>
      </div>
    </div>
  );
}
