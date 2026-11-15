import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "cn";
import { CATEGORIES, getCategoryBySlug } from "@/lib/constants/categories";
import { CategoryIcon } from "@/components/layout/category-icon";
import { ItemGrid } from "@/components/marketplace/item-grid";
import { Skeleton } from "@/components/ui/skeleton";

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) {
    return { title: "Category Not Found | Mini-Marketplace" };
  }
  return {
    title: `${category.name} | Mini-Marketplace`,
    description: category.description,
  };
}

function CategoryGridFallback() {
  return (
    <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 sm:py-5 space-y-4">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white"
          >
            <Skeleton className="aspect-[4/3] w-full rounded-none bg-[#E2E8F0]" />
            <div className="space-y-2 p-3.5">
              <Skeleton className="h-5 w-20 bg-[#E2E8F0]" />
              <Skeleton className="h-4 w-full bg-[#E2E8F0]" />
              <Skeleton className="h-3 w-2/3 bg-[#E2E8F0]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <div>
      {/* Category Hero Header */}
      <div className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5">
          <nav
            aria-label="Breadcrumb"
            className="mb-2 flex items-center gap-1 text-xs font-medium text-[#64748B]"
          >
            <Link href="/" className="hover:text-[#1877F2] transition-colors">
              Marketplace
            </Link>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <span className="text-[#0F172A]">{category.name}</span>
          </nav>

          <div className="animate-fade-up flex items-center gap-3.5">
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#E2E8F0]/70 shadow-2xs",
                category.badgeBg,
                category.badgeText
              )}
            >
              <CategoryIcon name={category.iconName} className="size-6" />
            </span>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
                {category.name}
              </h1>
              <p className="text-sm text-[#64748B]">{category.description}</p>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<CategoryGridFallback />}>
        <ItemGrid initialCategory={category.slug} />
      </Suspense>
    </div>
  );
}
