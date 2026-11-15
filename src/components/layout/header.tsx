"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Menu, Plus, Search, Store, X } from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";

function getCategoryFromPath(pathname: string): string {
  const match = pathname.match(/^\/category\/([^/]+)/);
  if (!match) return "all";
  const slug = decodeURIComponent(match[1]);
  const exists = CATEGORIES.some((c) => c.slug === slug);
  return exists ? slug : "all";
}

function HeaderSearchForm({
  initialQuery,
  initialCategory,
}: {
  initialQuery: string;
  initialCategory: string;
}) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [prevUrlQuery, setPrevUrlQuery] = useState(initialQuery);
  const [prevUrlCategory, setPrevUrlCategory] = useState(initialCategory);

  if (initialQuery !== prevUrlQuery) {
    setPrevUrlQuery(initialQuery);
    setKeyword(initialQuery);
  }

  if (initialCategory !== prevUrlCategory) {
    setPrevUrlCategory(initialCategory);
    setSelectedCategory(initialCategory);
  }

  function navigateSearch(nextKeyword: string, nextCategory: string) {
    const trimmed = nextKeyword.trim();
    const basePath =
      nextCategory && nextCategory !== "all"
        ? `/category/${encodeURIComponent(nextCategory)}`
        : "/";

    if (trimmed) {
      const params = new URLSearchParams();
      params.set("q", trimmed);
      router.push(`${basePath}?${params.toString()}`);
    } else {
      router.push(basePath);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigateSearch(keyword, selectedCategory);
  }

  function handleClear() {
    setKeyword("");
    if (initialQuery) {
      navigateSearch("", selectedCategory);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search marketplace listings"
      className="flex w-full max-w-2xl items-center rounded-full border border-[#E2E8F0] bg-[#F4F6FB] p-1 transition-all duration-200 ease-out hover:border-[#CBD5E1] focus-within:border-[#1877F2] focus-within:bg-white focus-within:shadow-[0_4px_16px_rgba(24,119,242,0.12)] focus-within:ring-2 focus-within:ring-[#1877F2]/20"
    >
      <div className="hidden md:block shrink-0">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger
            aria-label="Filter by category"
            className="h-8 w-[158px] shrink-0 border-0 bg-transparent pl-3 pr-2 text-xs font-medium text-[#0F172A] shadow-none focus-visible:ring-0 rounded-full hover:bg-[#E2E8F0]/60 [&_[data-slot=select-value]]:truncate"
          >
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((category) => (
              <SelectItem key={category.slug} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className="hidden md:block h-5 w-px bg-[#E2E8F0] mx-1 shrink-0"
        aria-hidden="true"
      />

      <div className="relative flex flex-1 items-center min-w-0">
        <Search
          className="pointer-events-none ml-2.5 size-4 shrink-0 text-[#64748B]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search listings by title, keyword, or city..."
          aria-label="Search listings by title, keyword, or city"
          className="h-8 w-full min-w-0 bg-transparent px-2.5 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {keyword && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="mr-1 flex size-6 shrink-0 items-center justify-center rounded-full text-[#64748B] transition-colors hover:bg-[#E2E8F0] hover:text-[#0F172A]"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <Button
        type="submit"
        size="sm"
        className="h-8 shrink-0 rounded-full bg-gradient-to-r from-[#1877F2] to-[#2563EB] px-3.5 text-xs font-semibold text-white shadow-xs transition-all duration-150 hover:from-[#166FE5] hover:to-[#1D4ED8] active:scale-[0.98]"
      >
        <Search className="size-3.5 sm:hidden" aria-hidden="true" />
        <span className="hidden sm:inline">Search</span>
      </Button>
    </form>
  );
}

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("q") ?? "";
  const urlCategory = getCategoryFromPath(pathname);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div
        className="h-[3px] w-full bg-gradient-to-r from-[#1877F2] via-[#4338CA] to-[#06B6D4]"
        aria-hidden="true"
      />
      <div className="flex h-[61px] items-center justify-between gap-3 px-3 sm:px-5 lg:grid lg:grid-cols-[minmax(max-content,1fr)_minmax(0,42rem)_minmax(max-content,1fr)] lg:gap-5">
        {/* Left: Mobile drawer trigger + Brand logo */}
        <div className="flex shrink-0 items-center gap-2 lg:justify-self-start">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-[#0F172A] hover:bg-[#F1F5F9]"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[272px] p-0">
              <SheetTitle className="sr-only">Marketplace Navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Browse categories or create a new marketplace listing
              </SheetDescription>
              <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="group flex items-center gap-2.5 rounded-xl py-1 pr-1 transition-opacity hover:opacity-95"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1877F2] to-[#4338CA] text-white shadow-sm shadow-[#1877F2]/25 transition-transform duration-200 ease-out group-hover:scale-105 group-hover:-rotate-3">
              <Store className="size-5" aria-hidden="true" />
            </span>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <span className="font-display text-lg font-bold tracking-tight text-[#0F172A]">
                Marketplace
              </span>
              <span className="rounded-full border border-[#1877F2]/20 bg-[#EAF2FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1466D8]">
                Local
              </span>
            </span>
          </Link>
        </div>

        {/* Center: Integrated Search Bar (render-phase URL sync, never remounted) */}
        <div className="flex flex-1 min-w-0 justify-center w-full">
          <HeaderSearchForm
            initialQuery={urlQuery}
            initialCategory={urlCategory}
          />
        </div>

        {/* Right: Seller Stripe Connect + Primary Create Listing CTA */}
        <div className="flex shrink-0 items-center gap-2 lg:justify-self-end">
          <Button
            asChild
            variant="outline"
            className="h-9 rounded-xl border-[#E2E8F0] bg-white px-2.5 sm:px-3 text-xs sm:text-sm font-semibold text-[#0F172A] shadow-2xs transition-all duration-200 ease-out hover:border-[#635BFF]/40 hover:bg-[#F5F3FF] hover:text-[#4F46E5] active:scale-[0.98]"
          >
            <Link href="/connect">
              <CreditCard className="size-4 text-[#635BFF]" aria-hidden="true" />
              <span className="hidden md:inline">Connect with Stripe</span>
            </Link>
          </Button>

          <Button
            asChild
            className="h-9 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#2563EB] px-3 sm:px-4 text-sm font-semibold text-white shadow-sm shadow-[#1877F2]/20 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:from-[#166FE5] hover:to-[#1D4ED8] hover:shadow-md hover:shadow-[#1877F2]/25 active:translate-y-0 active:scale-[0.98]"
          >
            <Link href="/create">
              <Plus className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Create listing</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
