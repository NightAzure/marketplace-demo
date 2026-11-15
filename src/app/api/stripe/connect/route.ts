import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getAppUrl,
  getStripeClient,
  isStripeConfigured,
  normalizeSellerEmail,
} from "@/lib/stripe/server";
import { getSellerAccountByEmail } from "@/lib/supabase/queries";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { connectStripeSchema } from "@/lib/types";

function escapeIlikeExact(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

async function getSellerListingStats(
  email: string
): Promise<{ total: number; available: number; sold: number }> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("listings")
    .select("id, status")
    .ilike("seller_email", escapeIlikeExact(email));

  const rows = data ?? [];
  const sold = rows.filter((row) => row.status === "sold").length;
  const available = rows.length - sold;
  return { total: rows.length, available, sold };
}

async function syncStripeAccountToDb(
  stripe: Stripe,
  stripeAccountId: string,
  fallbackEmail: string
) {
  const supabase = createServerSupabaseClient();

  try {
    const account = await stripe.accounts.retrieve(stripeAccountId);
    if ("deleted" in account && account.deleted) {
      return null;
    }

    const { data, error } = await supabase
      .from("seller_accounts")
      .upsert(
        {
          email: normalizeSellerEmail(fallbackEmail),
          stripe_account_id: account.id,
          charges_enabled: Boolean(account.charges_enabled),
          payouts_enabled: Boolean(account.payouts_enabled),
          details_submitted: Boolean(account.details_submitted),
        },
        { onConflict: "email" }
      )
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.toLowerCase().includes("no such account")) {
      return null;
    }
    throw err;
  }
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = connectStripeSchema.safeParse({
    email: searchParams.get("email") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Valid email is required." },
      { status: 400 }
    );
  }

  const email = parsed.data.email;

  try {
    const supabase = createServerSupabaseClient();
    const { account: existing, error } = await getSellerAccountByEmail(
      supabase,
      email
    );

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    const listingStats = await getSellerListingStats(email);

    if (!existing) {
      return NextResponse.json({
        connected: false,
        onboarded: false,
        account: null,
        listingStats,
      });
    }

    const stripe = getStripeClient();
    const synced = await syncStripeAccountToDb(
      stripe,
      existing.stripe_account_id,
      email
    );

    if (!synced) {
      return NextResponse.json({
        connected: false,
        onboarded: false,
        account: null,
        listingStats,
      });
    }

    return NextResponse.json({
      connected: true,
      onboarded: Boolean(synced.charges_enabled),
      account: synced,
      listingStats,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to check Stripe Connect status.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
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

  const parsed = connectStripeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message || "Validation failed.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const email = parsed.data.email;
  const forceLink =
    typeof body === "object" &&
    body !== null &&
    "force" in body &&
    Boolean((body as { force?: unknown }).force);

  try {
    const supabase = createServerSupabaseClient();
    const stripe = getStripeClient();
    const { account: existing, error: lookupError } =
      await getSellerAccountByEmail(supabase, email);

    if (lookupError) {
      return NextResponse.json({ error: lookupError }, { status: 500 });
    }

    let accountRecord = existing
      ? await syncStripeAccountToDb(stripe, existing.stripe_account_id, email)
      : null;

    if (!accountRecord) {
      const createdAccount = await stripe.accounts.create({
        type: "standard",
        email,
        metadata: {
          seller_email: email,
          marketplace: "mini-marketplace",
        },
      });

      const { data: inserted, error: upsertError } = await supabase
        .from("seller_accounts")
        .upsert(
          {
            email,
            stripe_account_id: createdAccount.id,
            charges_enabled: Boolean(createdAccount.charges_enabled),
            payouts_enabled: Boolean(createdAccount.payouts_enabled),
            details_submitted: Boolean(createdAccount.details_submitted),
          },
          { onConflict: "email" }
        )
        .select("*")
        .single();

      if (upsertError || !inserted) {
        return NextResponse.json(
          {
            error:
              upsertError?.message ??
              "Failed to save Stripe connected account.",
          },
          { status: 500 }
        );
      }

      accountRecord = inserted;
    }

    const listingStats = await getSellerListingStats(email);

    if (accountRecord.charges_enabled && !forceLink) {
      return NextResponse.json({
        alreadyOnboarded: true,
        url: null,
        account: accountRecord,
        listingStats,
      });
    }

    const appUrl = getAppUrl(request);
    const encodedEmail = encodeURIComponent(email);
    const encodedAccountId = encodeURIComponent(accountRecord.stripe_account_id);

    const accountLink = await stripe.accountLinks.create({
      account: accountRecord.stripe_account_id,
      refresh_url: `${appUrl}/connect?refresh=1&email=${encodedEmail}`,
      return_url: `${appUrl}/connect?return=1&email=${encodedEmail}&account_id=${encodedAccountId}`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      alreadyOnboarded: false,
      url: accountLink.url,
      account: accountRecord,
      listingStats,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to start Stripe Connect onboarding.",
      },
      { status: 500 }
    );
  }
}
