import { NextResponse } from "next/server";
import {
  getCategoryByName,
  getCategoryBySlug,
} from "@/lib/constants/categories";
import { normalizeSellerEmail } from "@/lib/stripe/server";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  getOnboardedSellerEmails,
  normalizeListing,
} from "@/lib/supabase/queries";
import { createListingSchema, type SortOption } from "@/lib/types";

const SUPABASE_UNCONFIGURED_ERROR =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and key to .env.local.";

function parsePositiveInt(
  raw: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function parseSort(raw: string | null): SortOption {
  if (raw === "price_asc" || raw === "price_desc" || raw === "newest") {
    return raw;
  }
  return "newest";
}

function sanitizeSearchTerm(raw: string): string {
  // Strip characters that break PostgREST `.or(...)` syntax or act as wildcards
  return raw.replace(/[,()%_\\]/g, " ").trim().replace(/\s+/g, " ");
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: SUPABASE_UNCONFIGURED_ERROR },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawQ = searchParams.get("q")?.trim() ?? "";
    const rawCategory = searchParams.get("category")?.trim() ?? "";
    const sort = parseSort(searchParams.get("sort"));
    const limit = parsePositiveInt(searchParams.get("limit"), 60, 1, 100);
    const offset = parsePositiveInt(searchParams.get("offset"), 0, 0, 10_000);

    const supabase = createServerSupabaseClient();
    let query = supabase
      .from("listings")
      .select("*", { count: "exact" })
      .eq("status", "available");

    if (rawCategory && rawCategory.toLowerCase() !== "all") {
      const resolvedCategory =
        getCategoryBySlug(rawCategory)?.name ??
        getCategoryByName(rawCategory)?.name ??
        rawCategory;
      query = query.eq("category", resolvedCategory);
    }

    if (rawQ) {
      const sanitized = sanitizeSearchTerm(rawQ);
      if (sanitized) {
        const pattern = `%${sanitized}%`;
        query = query.or(
          `title.ilike.${pattern},description.ilike.${pattern},location.ilike.${pattern},category.ilike.${pattern}`
        );
      }
    }

    if (sort === "price_asc") {
      query = query
        .order("price", { ascending: true })
        .order("created_at", { ascending: false });
    } else if (sort === "price_desc") {
      query = query
        .order("price", { ascending: false })
        .order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as Record<string, unknown>[];
    const onboardedSet = await getOnboardedSellerEmails(
      supabase,
      rows.map((row) => String(row.seller_email ?? ""))
    );

    const listings = rows.map((row) =>
      normalizeListing(
        row,
        onboardedSet.has(normalizeSellerEmail(String(row.seller_email ?? "")))
      )
    );

    return NextResponse.json({
      listings,
      total: count ?? listings.length,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to fetch listings.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: SUPABASE_UNCONFIGURED_ERROR },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const parsed = createListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("listings")
      .insert({
        title: parsed.data.title,
        description: parsed.data.description,
        price: parsed.data.price,
        category: parsed.data.category,
        seller_email: parsed.data.seller_email,
        image_url: parsed.data.image_url ?? null,
        location: parsed.data.location,
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create listing." },
        { status: 500 }
      );
    }

    const createdRow = data as Record<string, unknown>;
    const sellerEmail = normalizeSellerEmail(String(createdRow.seller_email ?? ""));
    const onboardedSet = await getOnboardedSellerEmails(supabase, [sellerEmail]);

    return NextResponse.json(
      { listing: normalizeListing(createdRow, onboardedSet.has(sellerEmail)) },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to create listing.",
      },
      { status: 500 }
    );
  }
}
