import { NextResponse } from "next/server";
import { getListingById } from "@/lib/supabase/queries";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const result = await getListingById(id);

  if (result.error || !result.listing) {
    return NextResponse.json(
      { error: result.error ?? "Listing not found." },
      { status: result.status }
    );
  }

  return NextResponse.json({ listing: result.listing }, { status: 200 });
}
