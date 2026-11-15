import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  calculatePlatformFeeCents,
  getStripeClient,
  isStripeConfigured,
  normalizeSellerEmail,
} from "@/lib/stripe/server";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  eventAccount?: string
) {
  if (session.payment_status !== "paid") {
    return;
  }

  const listingId = session.metadata?.listing_id?.trim();
  if (!listingId) {
    return;
  }

  const supabase = createServerSupabaseClient();

  let sellerEmail = session.metadata?.seller_email
    ? normalizeSellerEmail(session.metadata.seller_email)
    : "";
  let connectedAccountId =
    eventAccount || session.metadata?.connected_account_id?.trim() || "";

  if (!sellerEmail || !connectedAccountId) {
    const { data: listingRow } = await supabase
      .from("listings")
      .select("seller_email")
      .eq("id", listingId)
      .maybeSingle();

    if (listingRow?.seller_email) {
      sellerEmail = normalizeSellerEmail(String(listingRow.seller_email));
    }

    if (!connectedAccountId && sellerEmail) {
      const { data: sellerRow } = await supabase
        .from("seller_accounts")
        .select("stripe_account_id")
        .eq("email", sellerEmail)
        .maybeSingle();

      if (sellerRow?.stripe_account_id) {
        connectedAccountId = String(sellerRow.stripe_account_id);
      }
    }
  }

  const amountCents =
    typeof session.amount_total === "number"
      ? session.amount_total
      : Number(session.metadata?.amount_cents ?? 0);

  const parsedFee = Number(session.metadata?.platform_fee_cents);
  const platformFeeCents =
    Number.isFinite(parsedFee) && parsedFee >= 0
      ? parsedFee
      : calculatePlatformFeeCents(amountCents);
  const sellerPayoutCents = Math.max(0, amountCents - platformFeeCents);

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const buyerEmail =
    session.customer_details?.email?.trim().toLowerCase() ??
    session.customer_email?.trim().toLowerCase() ??
    null;

  const { error: orderError } = await supabase.from("orders").upsert(
    {
      listing_id: listingId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      connected_account_id: connectedAccountId,
      seller_email: sellerEmail,
      buyer_email: buyerEmail,
      amount_cents: amountCents,
      platform_fee_cents: platformFeeCents,
      seller_payout_cents: sellerPayoutCents,
      currency: session.currency ?? "usd",
      status: "paid",
    },
    { onConflict: "stripe_checkout_session_id" }
  );

  if (orderError) {
    throw new Error(`Failed to record order: ${orderError.message}`);
  }

  const { error: listingError } = await supabase
    .from("listings")
    .update({
      status: "sold",
      sold_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  if (listingError) {
    throw new Error(`Failed to mark listing as sold: ${listingError.message}`);
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("seller_accounts")
    .update({
      charges_enabled: Boolean(account.charges_enabled),
      payouts_enabled: Boolean(account.payouts_enabled),
      details_submitted: Boolean(account.details_submitted),
    })
    .eq("stripe_account_id", account.id);

  if (error) {
    throw new Error(`Failed to update seller account: ${error.message}`);
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

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 }
    );
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Webhook signature verification failed: ${err.message}`
            : "Webhook signature verification failed.",
      },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, event.account);
        break;
      }
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}
