import type { SupabaseClient } from "@supabase/supabase-js";
import type { Listing, ListingStatus, SellerAccount } from "@/lib/types";
import { normalizeSellerEmail } from "@/lib/stripe/server";
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
 * Normalizes a raw Supabase `listings` row so `price` is always a JS `number`
 * and Stripe Connect / sold-status fields are consistently populated.
 */
export function normalizeListing(
  row: Record<string, unknown>,
  sellerOnboarded = false
): Listing {
  const rawStatus = row.status ? String(row.status) : "available";
  const status: ListingStatus = rawStatus === "sold" ? "sold" : "available";

  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    price: Number(row.price),
    category: String(row.category),
    seller_email: String(row.seller_email),
    image_url: row.image_url ? String(row.image_url) : null,
    location: String(row.location ?? "Local pickup"),
    status,
    sold_at: row.sold_at ? String(row.sold_at) : null,
    seller_onboarded: sellerOnboarded,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

/**
 * Fetches the set of normalized seller emails that have completed Stripe Connect onboarding
 * (`charges_enabled = true`). Fails softly with an empty set if migration hasn't run yet.
 */
export async function getOnboardedSellerEmails(
  supabase: SupabaseClient,
  emails: string[]
): Promise<Set<string>> {
  const uniqueEmails = Array.from(
    new Set(emails.map(normalizeSellerEmail).filter(Boolean))
  );

  if (uniqueEmails.length === 0) {
    return new Set();
  }

  try {
    const { data, error } = await supabase
      .from("seller_accounts")
      .select("email, charges_enabled")
      .in("email", uniqueEmails)
      .eq("charges_enabled", true);

    if (error || !data) {
      return new Set();
    }

    return new Set(
      data.map((row) => normalizeSellerEmail(String(row.email)))
    );
  } catch {
    return new Set();
  }
}

/**
 * Fetches a seller account record by email (case-insensitive).
 */
export async function getSellerAccountByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<{ account: SellerAccount | null; error: string | null }> {
  const normalized = normalizeSellerEmail(email);
  const { data, error } = await supabase
    .from("seller_accounts")
    .select("*")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    return { account: null, error: error.message };
  }

  return {
    account: (data as SellerAccount | null) ?? null,
    error: null,
  };
}

/**
 * Fetches a single listing by UUID from Supabase with explicit status codes
 * and seller Stripe onboarding readiness.
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

    const row = data as Record<string, unknown>;
    const sellerEmail = normalizeSellerEmail(String(row.seller_email ?? ""));
    const onboardedSet = await getOnboardedSellerEmails(supabase, [sellerEmail]);

    return {
      listing: normalizeListing(row, onboardedSet.has(sellerEmail)),
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
