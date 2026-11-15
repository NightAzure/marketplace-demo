"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  SearchX,
  X,
} from "lucide-react";
import { cn } from "cn";
import type { Listing, SortOption, ViewMode } from "@/lib/types";
import { getCategoryBySlug } from "@/lib/constants/categories";
import {
  getCachedListings,
  getLastListingsSnapshot,
  getServerSort,
  getServerViewMode,
  getStoredSort,
  getStoredViewMode,
  setCachedListings,
  setStoredSort,
  setStoredViewMode,
  subscribePreferences,
} from "@/lib/marketplace-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemCard } from "@/components/marketplace/item-card";

interface ItemGridProps {
  initialCategory?: string;
}

function GridSkeletons({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading listings">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-3"
          >
            <Skeleton className="h-28 w-32 sm:h-32 sm:w-44 shrink-0 rounded-xl bg-[#E2E8F0]" />
            <div className="flex flex-1 flex-col justify-between py-1">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24 bg-[#E2E8F0]" />
                <Skeleton className="h-4 w-2/3 bg-[#E2E8F0]" />
                <Skeleton className="h-3.5 w-full bg-[#E2E8F0]" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-3 w-32 bg-[#E2E8F0]" />
                <Skeleton className="h-7 w-28 rounded-xl bg-[#E2E8F0]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      aria-busy="true"
      aria-label="Loading listings"
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white"
        >
          <Skeleton className="aspect-[4/3] w-full rounded-none bg-[#E2E8F0]" />
          <div className="space-y-2 p-3.5">
            <Skeleton className="h-5 w-20 bg-[#E2E8F0]" />
            <Skeleton className="h-4 w-full bg-[#E2E8F0]" />
            <Skeleton className="h-4 w-3/4 bg-[#E2E8F0]" />
            <Skeleton className="mt-2 h-3 w-2/3 bg-[#E2E8F0]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ItemGrid({ initialCategory }: ItemGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = (searchParams.get("q") ?? "").trim();
  const activeCategorySlug = initialCategory?.trim().toLowerCase() || undefined;
  const activeCategoryItem = activeCategorySlug
    ? getCategoryBySlug(activeCategorySlug)
    : undefined;

  const sort = useSyncExternalStore(
    subscribePreferences,
    getStoredSort,
    getServerSort
  );
  const viewMode = useSyncExternalStore(
    subscribePreferences,
    getStoredViewMode,
    getServerViewMode
  );
  const [retryCount, setRetryCount] = useState<number>(0);

  const categoryParam = activeCategoryItem
    ? activeCategoryItem.name
    : activeCategorySlug ?? "";
  const cacheKey = `${q}::${categoryParam}::${sort}`;
  const requestKey = `${cacheKey}::${retryCount}`;

  const [fetchState, setFetchState] = useState<{
    key: string;
    listings: Listing[];
    total: number;
    error: string | null;
  }>({
    key: "",
    listings: [],
    total: 0,
    error: null,
  });

  const cached = getCachedListings(cacheKey);
  const lastSnapshot = getLastListingsSnapshot();
  const isPending = fetchState.key !== requestKey;

  const listings = cached
    ? cached.listings
    : fetchState.listings.length > 0
      ? fetchState.listings
      : (lastSnapshot?.listings ?? []);
  const total = cached
    ? cached.total
    : fetchState.listings.length > 0
      ? fetchState.total
      : (lastSnapshot?.total ?? 0);

  const showInitialSkeleton = isPending && !cached && listings.length === 0;
  const showTopProgress = isPending && !cached && listings.length > 0;
  const error = isPending ? null : fetchState.error;

  useEffect(() => {
    const controller = new AbortController();

    async function loadListings() {
      try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (categoryParam) params.set("category", categoryParam);
        params.set("sort", sort);

        const res = await fetch(`/api/listings?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        const data = (await res.json()) as {
          listings?: Listing[];
          total?: number;
          error?: string;
        };

        if (!res.ok) {
          throw new Error(
            data?.error || `Failed to load listings (HTTP ${res.status})`
          );
        }

        const nextListings = data.listings ?? [];
        const nextTotal = data.total ?? nextListings.length ?? 0;

        setCachedListings(cacheKey, nextListings, nextTotal);
        setFetchState({
          key: requestKey,
          listings: nextListings,
          total: nextTotal,
          error: null,
        });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setFetchState({
          key: requestKey,
          listings: [],
          total: 0,
          error:
            err instanceof Error
              ? err.message
              : "Something went wrong while loading listings.",
        });
      }
    }

    loadListings();
    return () => controller.abort();
  }, [q, categoryParam, sort, cacheKey, requestKey]);

  function handleSortChange(nextSort: SortOption) {
    setStoredSort(nextSort);
  }

  function handleViewModeChange(nextMode: ViewMode) {
    setStoredViewMode(nextMode);
  }

  function handleClearKeyword() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("q");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const isEnvError =
    error?.toLowerCase().includes("supabase") ||
    error?.toLowerCase().includes("configured") ||
    error?.toLowerCase().includes("env");

  return (
    <div className="relative mx-auto max-w-[1600px] px-3 py-4 sm:px-5 sm:py-5 space-y-4">
      {showTopProgress && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-[#1877F2] via-[#4338CA] to-[#06B6D4] bg-[length:200%_100%] animate-[marketplace-shimmer_1.4s_linear_infinite]"
        />
      )}

      {/* Toolbar row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          {!activeCategoryItem && (
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
              Today&apos;s picks
            </h1>
          )}

          {!showInitialSkeleton && !error && (
            <Badge
              variant="secondary"
              className="bg-white border border-[#E2E8F0] text-[#475569] font-semibold tabular-nums"
            >
              {total} {total === 1 ? "item" : "items"}
              {activeCategoryItem ? ` in ${activeCategoryItem.name}` : ""}
            </Badge>
          )}

          {q && (
            <Badge
              variant="secondary"
              className="gap-1.5 bg-[#EAF2FF] text-[#1466D8] border border-[#1877F2]/20 pl-2.5 pr-1.5 py-1 text-xs font-medium"
            >
              <span>Search: &ldquo;{q}&rdquo;</span>
              <button
                type="button"
                onClick={handleClearKeyword}
                aria-label="Clear keyword filter"
                className="rounded-full p-0.5 transition-colors hover:bg-[#1877F2]/15"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}
        </div>

        {/* Sort & View mode controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Select
            value={sort}
            onValueChange={(value) => handleSortChange(value as SortOption)}
          >
            <SelectTrigger
              aria-label="Sort listings"
              className="h-9 w-[175px] rounded-xl border-[#E2E8F0] bg-white text-xs font-medium text-[#0F172A] shadow-2xs transition-colors hover:border-[#CBD5E1]"
            >
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          <div
            role="group"
            aria-label="View mode"
            className="inline-flex items-center rounded-xl border border-[#E2E8F0] bg-white p-0.5 shadow-2xs"
          >
            <button
              type="button"
              onClick={() => handleViewModeChange("grid")}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg transition-all duration-200 ease-out active:scale-95",
                viewMode === "grid"
                  ? "bg-[#EAF2FF] text-[#1466D8] shadow-2xs"
                  : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("list")}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg transition-all duration-200 ease-out active:scale-95",
                viewMode === "list"
                  ? "bg-[#EAF2FF] text-[#1466D8] shadow-2xs"
                  : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              )}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content States */}
      {showInitialSkeleton ? (
        <GridSkeletons viewMode={viewMode} />
      ) : error ? (
        <div className="animate-fade-up rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 text-center shadow-xs">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#E11D48]/10 text-[#E11D48]">
            <AlertCircle className="size-6" aria-hidden="true" />
          </div>
          <h2 className="font-display mt-3 text-base font-semibold text-[#0F172A]">
            Unable to load listings
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#64748B]">{error}</p>
          {isEnvError && (
            <p className="mx-auto mt-2 max-w-lg rounded-xl bg-[#FAFBFD] px-3 py-2 text-xs text-[#64748B] border border-[#E2E8F0]">
              Hint: Ensure <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are set in{" "}
              <code className="font-mono">.env.local</code> and the{" "}
              <code className="font-mono">0001_init_marketplace.sql</code> migration has been applied.
            </p>
          )}
          <div className="mt-4">
            <Button
              type="button"
              onClick={() => setRetryCount((c) => c + 1)}
              className="gap-1.5 rounded-xl bg-[#1877F2] text-white hover:bg-[#166FE5]"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              <span>Retry</span>
            </Button>
          </div>
        </div>
      ) : listings.length === 0 ? (
        <div className="animate-fade-up rounded-2xl border border-[#E2E8F0] bg-white p-8 sm:p-12 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#EAF2FF] text-[#1466D8] animate-pop">
            <SearchX className="size-7" aria-hidden="true" />
          </div>
          <h2 className="font-display mt-4 text-lg font-semibold text-[#0F172A]">
            {q || activeCategoryItem
              ? "No matching listings found"
              : "No listings yet"}
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-[#64748B]">
            {q
              ? `We couldn't find any items matching "${q}"${
                  activeCategoryItem ? ` in ${activeCategoryItem.name}` : ""
                }. Try another keyword or browse all categories.`
              : activeCategoryItem
                ? `There are no items in ${activeCategoryItem.name} right now. Be the first to post one!`
                : "Be the first to list an item for your local community — no account required."}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {(q || activeCategoryItem) && (
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9]"
              >
                <Link href="/">Browse all listings</Link>
              </Button>
            )}
            <Button
              asChild
              className="gap-1.5 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#2563EB] text-white hover:from-[#166FE5] hover:to-[#1D4ED8]"
            >
              <Link href="/create">
                <Plus className="size-4" aria-hidden="true" />
                <span>Create a listing</span>
              </Link>
            </Button>
          </div>
        </div>
      ) : viewMode === "list" ? (
        <div
          key="list-view"
          className={cn(
            "flex flex-col gap-3 transition-opacity duration-200",
            showTopProgress ? "opacity-70" : "opacity-100"
          )}
        >
          {listings.map((listing, index) => (
            <ItemCard
              key={listing.id}
              listing={listing}
              viewMode="list"
              animationIndex={index}
            />
          ))}
        </div>
      ) : (
        <div
          key="grid-view"
          className={cn(
            "grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 transition-opacity duration-200",
            showTopProgress ? "opacity-70" : "opacity-100"
          )}
        >
          {listings.map((listing, index) => (
            <ItemCard
              key={listing.id}
              listing={listing}
              viewMode="grid"
              animationIndex={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
