import { NextResponse } from "next/server";
import {
  calculatePlatformFeeCents,
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
import type { Order } from "@/lib/types";

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
  const sessionId = searchParams.get("session_id")?.trim() ?? "";
  const listingId = searchParams.get("listing_id")?.trim() ?? "";

  if (!sessionId || !listingId) {
    return NextResponse.json(
      { error: "Both session_id and listing_id are required." },
      { status: 400 }
    );
  }

  try {
    const supabase = createServerSupabaseClient();
    const listingResult = await getListingById(listingId);

    if (listingResult.error || !listingResult.listing) {
      return NextResponse.json(
        { error: listingResult.error ?? "Listing not found." },
        { status: listingResult.status }
      );
    }

    const listing = listingResult.listing;

    const { data: orderData } = await supabase
      .from("orders")
      .select("*")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();

    const order = (orderData as Order | null) ?? null;

    let stripeSessionSummary: {
      id: string;
      payment_status: string;
      amount_total: number;
      platform_fee_cents: number;
      seller_payout_cents: number;
      buyer_email: string | null;
      payment_intent_id: string | null;
      currency: string;
    } | null = null;

    if (order) {
      stripeSessionSummary = {
        id: order.stripe_checkout_session_id,
        payment_status: order.status === "paid" ? "paid" : order.status,
        amount_total: order.amount_cents,
        platform_fee_cents: order.platform_fee_cents,
        seller_payout_cents: order.seller_payout_cents,
        buyer_email: order.buyer_email,
        payment_intent_id: order.stripe_payment_intent_id,
        currency: order.currency,
      };
    } else {
      const { account: sellerAccount } = await getSellerAccountByEmail(
        supabase,
        normalizeSellerEmail(listing.seller_email)
      );

      if (sellerAccount) {
        const stripe = getStripeClient();
        const session = await stripe.checkout.sessions.retrieve(
          sessionId,
          {},
          { stripeAccount: sellerAccount.stripe_account_id }
        );

        const amountTotal =
          typeof session.amount_total === "number"
            ? session.amount_total
            : Math.round(listing.price * 100);
        const parsedFee = Number(session.metadata?.platform_fee_cents);
        const platformFeeCents =
          Number.isFinite(parsedFee) && parsedFee >= 0
            ? parsedFee
            : calculatePlatformFeeCents(amountTotal);

        stripeSessionSummary = {
          id: session.id,
          payment_status: session.payment_status,
          amount_total: amountTotal,
          platform_fee_cents: platformFeeCents,
          seller_payout_cents: Math.max(0, amountTotal - platformFeeCents),
          buyer_email:
            session.customer_details?.email ?? session.customer_email ?? null,
          payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
          currency: session.currency ?? "usd",
        };
      }
    }

    return NextResponse.json({
      listing,
      order,
      stripeSession: stripeSessionSummary,
      webhookConfirmed: Boolean(
        order && order.status === "paid" && listing.status === "sold"
      ),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to retrieve order status.",
      },
      { status: 500 }
    );
  }
}
