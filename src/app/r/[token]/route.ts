import { NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleReviewUrl } from "@/lib/google";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { searchParams } = new URL(request.url);
  const ratingParam = searchParams.get("s");

  // Validate rating
  const rating = ratingParam ? parseInt(ratingParam, 10) : null;
  if (!rating || rating < 1 || rating > 5) {
    return new NextResponse("Invalid rating", { status: 400 });
  }

  // Look up review request with client, location, and provider
  const supabase = await createClient();
  const { data: reviewRequest } = await supabase
    .from("review_requests")
    .select("*, clients(*), locations(*), providers(*)")
    .eq("token", token)
    .single();

  if (!reviewRequest) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const client = reviewRequest.clients;
  const location = reviewRequest.locations;
  const provider = reviewRequest.providers;

  // Determine redirect URL: provider -> location -> client fallback
  let redirectUrl: string;
  if (rating === 5) {
    const placeId =
      provider?.google_place_id ||
      location?.google_place_id ||
      client.google_place_id;
    redirectUrl = getGoogleReviewUrl(placeId);
  } else {
    redirectUrl = location?.contact_page_url || client.contact_page_url;
  }

  // Get headers for logging
  const userAgent = request.headers.get("user-agent") || null;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  // Log asynchronously after response is sent
  after(async () => {
    const logSupabase = await createClient();

    await logSupabase
      .from("review_requests")
      .update({
        status: "clicked",
        clicked_at: new Date().toISOString(),
        rating_clicked: rating,
      })
      .eq("id", reviewRequest.id);

    await logSupabase.from("click_events").insert({
      review_request_id: reviewRequest.id,
      rating,
      redirected_to: redirectUrl,
      user_agent: userAgent,
      ip_address: ip,
    });
  });

  // Redirect immediately
  return NextResponse.redirect(redirectUrl, 302);
}
