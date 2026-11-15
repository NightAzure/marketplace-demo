import { NextResponse } from "next/server";
import { sendSellerNotificationEmail } from "@/lib/email/send-seller-email";
import { getListingById } from "@/lib/supabase/queries";
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { createMessageSchema } from "@/lib/types";

const SUPABASE_UNCONFIGURED_ERROR =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and key to .env.local.";

export async function GET() {
  return NextResponse.json(
    { error: "Messages are private and sent directly to the seller." },
    { status: 405 }
  );
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

  const parsed = createMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
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

  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("messages").insert({
      listing_id: listing.id,
      buyer_email: parsed.data.buyer_email,
      seller_email: listing.seller_email,
      message: parsed.data.message,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message ?? "Failed to save message." },
        { status: 500 }
      );
    }

    const emailResult = await sendSellerNotificationEmail({
      sellerEmail: listing.seller_email,
      buyerEmail: parsed.data.buyer_email,
      listingId: listing.id,
      listingTitle: listing.title,
      listingPrice: listing.price,
      message: parsed.data.message,
    });

    return NextResponse.json(
      {
        ok: true,
        emailSent: emailResult.sent,
        emailWarning: emailResult.error,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to send message.",
      },
      { status: 500 }
    );
  }
}
