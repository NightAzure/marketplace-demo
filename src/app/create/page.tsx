import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ImagePlus,
  Mail,
  ShoppingBag,
  Tag,
  Zap,
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";
import { CategoryIcon } from "@/components/layout/category-icon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function CreateListingPage() {
  return (
    <div className="animate-fade-up mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] transition-colors hover:text-[#1877F2]"
        >
          <ArrowLeft className="size-4" />
          Back to Marketplace
        </Link>
      </div>

      <div className="mb-5 sm:mb-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#1877F2]">
          Sell on Marketplace
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
          Choose listing type
        </h1>
        <p className="mt-1 text-sm text-[#64748B] sm:text-[15px]">
          Publish an item in seconds with live preview and direct email alerts.
        </p>
      </div>

      {/* Primary Listing Type Card */}
      <Link
        href="/create/item"
        className="group block rounded-2xl border border-[#1877F2]/25 bg-gradient-to-br from-white via-white to-[#F4F8FF] p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-8px_rgba(24,119,242,0.14)] transition-all duration-150 hover:border-[#1877F2]/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2] sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#EAF2FF] to-[#E0E7FF] text-[#1466D8] transition-all duration-150 group-hover:from-[#1877F2] group-hover:to-[#4338CA] group-hover:text-white sm:size-14 sm:rounded-2xl">
              <ShoppingBag className="size-6 sm:size-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-bold tracking-tight text-[#0F172A] transition-colors group-hover:text-[#1877F2]">
                  Item for Sale
                </h2>
                <Badge className="border border-[#1877F2]/15 bg-[#EAF2FF] text-[#1466D8] hover:bg-[#EAF2FF]">
                  Recommended
                </Badge>
              </div>
              <p className="mt-1 text-sm leading-snug text-[#64748B]">
                List furniture, electronics, vehicles, or anything else locally
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs font-medium text-[#475569]">
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="size-3.5 text-[#1466D8]" />
                  10 categories
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ImagePlus className="size-3.5 text-[#1466D8]" />
                  Live preview
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3.5 text-[#1466D8]" />
                  Email alerts
                </span>
              </div>
            </div>
          </div>

          <div className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all duration-150 group-hover:from-[#1565D8] group-hover:to-[#1D4ED8] group-active:scale-[0.98] sm:w-auto">
            Create item listing
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </Link>

      {/* Interactive Category Selector Grid */}
      <section className="mt-6 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:mt-7 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold tracking-tight text-[#0F172A]">
              Start in a specific category
            </h2>
            <p className="mt-0.5 text-xs text-[#64748B]">
              Tap any category below to open the form pre-filled.
            </p>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/create/item?category=${category.slug}`}
              className="group flex min-w-0 items-center justify-between gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-150 hover:-translate-y-0.5 hover:border-[#1877F2]/60 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2] active:scale-[0.98] active:bg-[#EAF2FF]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 group-hover:bg-[#1877F2] group-hover:text-white",
                    category.badgeBg,
                    category.badgeText
                  )}
                >
                  <CategoryIcon name={category.iconName} className="size-4" />
                </span>
                <span className="truncate text-xs font-semibold text-[#0F172A] transition-colors group-hover:text-[#1877F2] sm:text-[13px]">
                  {category.name}
                </span>
              </div>
              <ChevronRight
                className="size-4 shrink-0 text-[#94A3B8] transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-[#1877F2]"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Compact Marketplace Highlights */}
      <div className="mt-5 grid grid-cols-1 divide-y divide-[#E2E8F0] rounded-2xl border border-[#E2E8F0] bg-white/90 shadow-xs sm:mt-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="flex items-start gap-3 p-3.5 sm:p-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#1466D8]">
            <Zap className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-xs font-bold text-[#0F172A] sm:text-sm">
              Instant publishing
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-[#64748B]">
              Appears immediately in the feed and category tabs.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 sm:p-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#1466D8]">
            <ImagePlus className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-xs font-bold text-[#0F172A] sm:text-sm">
              Live listing preview
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-[#64748B]">
              Upload photos and check how your card looks as you type.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 sm:p-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#1466D8]">
            <Mail className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-xs font-bold text-[#0F172A] sm:text-sm">
              Masked email privacy
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-[#64748B]">
              Your address stays hidden while buyer alerts reach your inbox.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
