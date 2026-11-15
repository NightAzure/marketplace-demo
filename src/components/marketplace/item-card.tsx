"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, MessageCircle, Package } from "lucide-react";
import { cn } from "cn";
import type { Listing, ViewMode } from "@/lib/types";
import { getCategoryByName } from "@/lib/constants/categories";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

interface ItemCardProps {
  listing: Listing;
  viewMode: ViewMode;
  previewMode?: boolean;
  animationIndex?: number;
}

function CardWrapper({
  href,
  previewMode,
  className,
  style,
  children,
}: {
  href: string;
  previewMode?: boolean;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  if (previewMode) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  );
}

function ListingThumbnail({
  imageUrl,
  title,
  onError,
  hasError,
  className,
}: {
  imageUrl: string | null;
  title: string;
  onError: () => void;
  hasError: boolean;
  className?: string;
}) {
  const showImage = Boolean(imageUrl && imageUrl.trim()) && !hasError;

  if (!showImage) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-1.5 bg-[#EEF2F7] text-[#64748B]",
          className
        )}
      >
        <Package className="size-8 stroke-[1.5]" aria-hidden="true" />
        <span className="text-[11px] font-medium">No photo</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl ?? undefined}
      alt={title || "Marketplace listing photo"}
      onError={onError}
      loading="lazy"
      className={cn(
        "h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]",
        className
      )}
    />
  );
}

export function ItemCard({
  listing,
  viewMode,
  previewMode = false,
  animationIndex,
}: ItemCardProps) {
  const [imgError, setImgError] = useState(false);
  const href = `/item/${listing.id}`;
  const formattedPrice = formatPrice(listing.price);
  const isFree = listing.price === 0 || formattedPrice === "Free";
  const relativeTime = formatRelativeTime(listing.created_at);
  const categoryItem = getCategoryByName(listing.category);
  const entranceStyle: CSSProperties | undefined =
    !previewMode && typeof animationIndex === "number"
      ? { animationDelay: `${Math.min(animationIndex, 10) * 28}ms` }
      : undefined;

  if (viewMode === "list") {
    return (
      <CardWrapper
        href={href}
        previewMode={previewMode}
        style={entranceStyle}
        className={cn(
          "group flex gap-3.5 sm:gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 ease-out",
          !previewMode &&
            "animate-fade-up hover:-translate-y-0.5 hover:border-[#1877F2]/35 hover:shadow-[0_12px_28px_-6px_rgba(24,119,242,0.16),0_4px_10px_rgba(15,23,42,0.06)] active:scale-[0.995]"
        )}
      >
        <div className="relative h-28 w-32 sm:h-32 sm:w-44 shrink-0 overflow-hidden rounded-xl bg-[#F4F6FB]">
          <ListingThumbnail
            imageUrl={listing.image_url}
            title={listing.title}
            hasError={imgError}
            onError={() => setImgError(true)}
          />
        </div>

        <div className="flex flex-1 flex-col justify-between min-w-0 py-0.5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={cn(
                  "font-display text-lg font-bold tabular-nums tracking-tight",
                  isFree ? "text-[#059669]" : "text-[#0F172A]"
                )}
              >
                {formattedPrice}
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  "border font-semibold",
                  categoryItem?.pillClass ??
                    "bg-[#EAF2FF] text-[#1466D8] border-[#1877F2]/20"
                )}
              >
                {listing.category}
              </Badge>
            </div>

            <h3 className="mt-1 line-clamp-1 text-base font-semibold text-[#0F172A] transition-colors group-hover:text-[#1877F2]">
              {listing.title}
            </h3>

            <p className="mt-1 line-clamp-2 text-sm text-[#64748B]">
              {listing.description}
            </p>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] min-w-0">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{listing.location}</span>
              <span aria-hidden="true">·</span>
              <span className="shrink-0">{relativeTime}</span>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#EAF2FF] px-3 py-1.5 text-xs font-semibold text-[#1466D8] transition-colors group-hover:bg-[#1877F2] group-hover:text-white">
              <MessageCircle className="size-3.5" aria-hidden="true" />
              <span>View &amp; Message</span>
            </span>
          </div>
        </div>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper
      href={href}
      previewMode={previewMode}
      style={entranceStyle}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 ease-out",
        !previewMode &&
          "animate-fade-up hover:-translate-y-1 hover:border-[#1877F2]/35 hover:shadow-[0_12px_28px_-6px_rgba(24,119,242,0.16),0_4px_10px_rgba(15,23,42,0.06)] active:scale-[0.985]"
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F4F6FB]">
        <ListingThumbnail
          imageUrl={listing.image_url}
          title={listing.title}
          hasError={imgError}
          onError={() => setImgError(true)}
        />
        <span
          className={cn(
            "absolute top-2.5 left-2.5 max-w-[85%] truncate rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shadow-xs backdrop-blur-xs",
            categoryItem?.pillClass ??
              "bg-white/90 text-[#0F172A] border-[#E2E8F0]"
          )}
        >
          {listing.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div>
          <p
            className={cn(
              "font-display text-lg font-bold leading-snug tabular-nums tracking-tight",
              isFree ? "text-[#059669]" : "text-[#0F172A]"
            )}
          >
            {formattedPrice}
          </p>
          <h3 className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-[#0F172A] transition-colors group-hover:text-[#1877F2]">
            {listing.title}
          </h3>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#F1F5F9] pt-2 text-xs text-[#64748B]">
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{listing.location}</span>
            <span className="shrink-0" aria-hidden="true">
              ·
            </span>
            <span className="shrink-0">{relativeTime}</span>
          </div>

          <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-[#1877F2] translate-x-1 opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100">
            <span>View</span>
            <ArrowRight className="size-3" aria-hidden="true" />
          </span>
        </div>
      </div>
    </CardWrapper>
  );
}
