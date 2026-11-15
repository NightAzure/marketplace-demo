import type { Listing } from "@/lib/types";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Normalizes a raw Supabase `listings` row so `price` is always a JS `number`.
 */
export function normalizeListing(row: Record<string, unknown>): Listing {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    price: Number(row.price),
    category: String(row.category),
    seller_email: String(row.seller_email),
    image_url: row.image_url ? String(row.image_url) : null,
    location: String(row.location ?? "Local pickup"),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

/**
 * Fetches a single listing by UUID from Supabase with explicit status codes.
 */
export async function getListingById(
  id: string
): Promise<{ listing: Listing | null; error: string | null; status: number }> {
  if (!isValidUuid(id)) {
    return {
      listing: null,
      error: "Invalid listing ID format.",
      status: 400,
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      listing: null,
      error:
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and key to .env.local.",
      status: 503,
    };
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return {
        listing: null,
        error: error.message,
        status: 500,
      };
    }

    if (!data) {
      return {
        listing: null,
        error: "Listing not found.",
        status: 404,
      };
    }

    return {
      listing: normalizeListing(data as Record<string, unknown>),
      error: null,
      status: 200,
    };
  } catch (err) {
    return {
      listing: null,
      error: err instanceof Error ? err.message : "Failed to fetch listing.",
      status: 500,
    };
  }
}
