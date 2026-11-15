"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Plus, Store } from "lucide-react";
import { cn } from "cn";
import { CATEGORIES } from "@/lib/constants/categories";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CategoryIcon } from "@/components/layout/category-icon";

interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ onNavigate, className }: SidebarProps) {
  const pathname = usePathname();
  const isBrowseAll = pathname === "/";
  const isConnect = pathname === "/connect";

  return (
    <nav
      aria-label="Marketplace navigation"
      className={cn("flex h-full flex-col bg-[#FAFBFD] select-none", className)}
    >
      {/* Top header */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="font-display text-xl font-bold tracking-tight text-[#0F172A]">
          Marketplace
        </h2>
      </div>

      {/* Primary actions */}
      <div className="px-2.5 space-y-1.5">
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(
            "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200 ease-out active:scale-[0.98]",
            isBrowseAll
              ? "bg-[#EAF2FF] text-[#1466D8] font-semibold shadow-[inset_0_0_0_1px_rgba(24,119,242,0.12)]"
              : "text-[#0F172A] font-medium hover:bg-[#F1F5F9] hover:translate-x-0.5"
          )}
        >
          {isBrowseAll && (
            <span
              className="animate-pop absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-gradient-to-b from-[#1877F2] to-[#4338CA]"
              aria-hidden="true"
            />
          )}
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ease-out",
              isBrowseAll
                ? "bg-gradient-to-br from-[#1877F2] to-[#4338CA] text-white shadow-xs"
                : "bg-[#EAF2FF] text-[#1466D8] group-hover:scale-105 group-hover:bg-[#DCEAFE]"
            )}
          >
            <Store className="size-4" aria-hidden="true" />
          </span>
          <span>Browse all</span>
        </Link>

        <div className="pt-1 px-0.5 space-y-1.5">
          <Button
            asChild
            className="w-full justify-center gap-1.5 rounded-xl bg-[#EAF2FF] hover:bg-[#DCEAFE] text-[#1466D8] font-semibold shadow-none border border-[#1877F2]/20 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-[0.98]"
          >
            <Link href="/create" onClick={onNavigate}>
              <Plus className="size-4" aria-hidden="true" />
              <span>Create new listing</span>
            </Link>
          </Button>

          <Link
            href="/connect"
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200 ease-out active:scale-[0.98]",
              isConnect
                ? "bg-[#F5F3FF] text-[#4F46E5] font-semibold shadow-[inset_0_0_0_1px_rgba(99,91,255,0.18)]"
                : "text-[#0F172A] font-medium hover:bg-[#F1F5F9] hover:translate-x-0.5"
            )}
          >
            {isConnect && (
              <span
                className="animate-pop absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-gradient-to-b from-[#635BFF] to-[#4338CA]"
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ease-out",
                isConnect
                  ? "bg-gradient-to-br from-[#635BFF] to-[#4338CA] text-white shadow-xs"
                  : "bg-[#F5F3FF] text-[#635BFF] group-hover:scale-105 group-hover:bg-[#EDE9FE]"
              )}
            >
              <CreditCard className="size-4" aria-hidden="true" />
            </span>
            <span>Connect with Stripe</span>
          </Link>
        </div>
      </div>

      <Separator className="my-3 bg-[#E2E8F0]/80" />

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-4">
        <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-[#64748B] uppercase">
          Categories
        </p>
        <ul className="space-y-0.5">
          {CATEGORIES.map((category) => {
            const href = `/category/${category.slug}`;
            const isActive = pathname === href;

            return (
              <li key={category.slug}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200 ease-out active:scale-[0.98]",
                    isActive
                      ? "bg-[#EAF2FF] text-[#1466D8] font-semibold shadow-[inset_0_0_0_1px_rgba(24,119,242,0.12)]"
                      : "text-[#0F172A] font-medium hover:bg-[#F1F5F9] hover:translate-x-0.5"
                  )}
                >
                  {isActive && (
                    <span
                      className="animate-pop absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-gradient-to-b from-[#1877F2] to-[#4338CA]"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ease-out",
                      isActive
                        ? "bg-gradient-to-br from-[#1877F2] to-[#4338CA] text-white shadow-xs"
                        : cn(
                            category.badgeBg,
                            category.badgeText,
                            "group-hover:scale-105 group-hover:bg-[#DCEAFE]"
                          )
                    )}
                  >
                    <CategoryIcon name={category.iconName} className="size-4" />
                  </span>
                  <span className="truncate">{category.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
