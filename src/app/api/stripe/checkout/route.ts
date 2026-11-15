import { NextResponse } from "next/server";
import {
  MIN_STRIPE_PRICE_USD,
  PLATFORM_FEE_PERCENT,
  calculatePlatformFeeCents,
  getAppUrl,
  getStripeClient,
  isStripeConfigured,
  normalizeSellerEmail,
} from "@/lib/stripe/server";
import {
  getListingById,
  getSellerAccountByEmail,
} from "@/lib/supabase/queries";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { createCheckoutSchema } from "@/lib/types";

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

  const parsed = createCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message || "Invalid listing ID.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const listingResult = await getListingById(parsed.data.listing_id);
  if (listingResult.error || !listingResult.listing) {
    return NextResponse.json(
      { error: listingResult.error ?? "Listing not found." },
      { status: listingResult.status }
    );
  }

  const listing = listingResult.listing;

  if (listing.status === "sold") {
    return NextResponse.json(
      { error: "This item has already been sold." },
      { status: 409 }
    );
  }

  if (!Number.isFinite(listing.price) || listing.price < MIN_STRIPE_PRICE_USD) {
    return NextResponse.json(
      {
        error:
          "Free or under-$0.50 listings cannot be purchased via Stripe Checkout.",
      },
      { status: 400 }
    );
  }

  try {
    const supabase = createServerSupabaseClient();
    const stripe = getStripeClient();

    // Prevent double-purchase if a paid order already exists
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("status", "paid")
      .maybeSingle();

    if (existingOrder) {
      return NextResponse.json(
        { error: "This item has already been purchased." },
        { status: 409 }
      );
    }

    const sellerEmail = normalizeSellerEmail(listing.seller_email);
    const { account: sellerAccount, error: sellerErr } =
      await getSellerAccountByEmail(supabase, sellerEmail);

    if (sellerErr) {
      return NextResponse.json({ error: sellerErr }, { status: 500 });
    }

    if (!sellerAccount) {
      return NextResponse.json(
        {
          error:
            "This seller has not connected a Stripe account yet, so online checkout is unavailable.",
        },
        { status: 400 }
      );
    }

    // Verify connected account readiness directly with Stripe if DB says incomplete
    let chargesEnabled = sellerAccount.charges_enabled;
    if (!chargesEnabled) {
      const liveAccount = await stripe.accounts.retrieve(
        sellerAccount.stripe_account_id
      );
      chargesEnabled = Boolean(liveAccount.charges_enabled);
      if (chargesEnabled) {
        await supabase
          .from("seller_accounts")
          .update({
            charges_enabled: true,
            payouts_enabled: Boolean(liveAccount.payouts_enabled),
            details_submitted: Boolean(liveAccount.details_submitted),
          })
          .eq("stripe_account_id", sellerAccount.stripe_account_id);
      }
    }

    if (!chargesEnabled) {
      return NextResponse.json(
        {
          error:
            "This seller has not finished Stripe Connect onboarding yet.",
        },
        { status: 400 }
      );
    }

    const amountCents = Math.round(listing.price * 100);
    const platformFeeCents = calculatePlatformFeeCents(amountCents);
    const appUrl = getAppUrl(request);

    // Direct charge created on the seller's connected account with application fee
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amountCents,
              product_data: {
                name: listing.title,
                description: listing.description.slice(0, 500),
                ...(listing.image_url ? { images: [listing.image_url] } : {}),
              },
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: platformFeeCents,
          metadata: {
            listing_id: listing.id,
            seller_email: sellerEmail,
            connected_account_id: sellerAccount.stripe_account_id,
            platform_fee_percent: String(PLATFORM_FEE_PERCENT),
          },
        },
        metadata: {
          listing_id: listing.id,
          seller_email: sellerEmail,
          connected_account_id: sellerAccount.stripe_account_id,
          amount_cents: String(amountCents),
          platform_fee_cents: String(platformFeeCents),
        },
        success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&listing_id=${encodeURIComponent(listing.id)}`,
        cancel_url: `${appUrl}/item/${encodeURIComponent(listing.id)}?canceled=1`,
      },
      {
        stripeAccount: sellerAccount.stripe_account_id,
      }
    );

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a Checkout URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to create Stripe Checkout session.",
      },
      { status: 500 }
    );
  }
}
