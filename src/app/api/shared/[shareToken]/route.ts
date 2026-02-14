import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = await createClient();

  // Look up client by share token
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, brand_color, logo_url")
    .eq("share_token", shareToken)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Build query for this client's review requests
  let requestsQuery = supabase
    .from("review_requests")
    .select("id, status, opened_at, rating_clicked, created_at, customer_name")
    .eq("client_id", client.id);

  if (from) {
    requestsQuery = requestsQuery.gte("created_at", from);
  }
  if (to) {
    requestsQuery = requestsQuery.lte("created_at", `${to}T23:59:59`);
  }

  const { data: requests } = await requestsQuery
    .order("created_at", { ascending: false })
    .limit(500);

  const allRequests = requests || [];
  const totalSent = allRequests.filter((r) => r.status !== "pending").length;
  const totalOpened = allRequests.filter((r) => r.opened_at !== null).length;
  const totalClicked = allRequests.filter((r) => r.status === "clicked").length;

  // Rating distribution
  const distribution = [0, 0, 0, 0, 0];
  const ratedRequests = allRequests.filter((r) => r.rating_clicked);
  ratedRequests.forEach((r) => {
    if (r.rating_clicked! >= 1 && r.rating_clicked! <= 5) {
      distribution[r.rating_clicked! - 1]++;
    }
  });

  const avgRating =
    ratedRequests.length > 0
      ? (
          ratedRequests.reduce((sum, r) => sum + r.rating_clicked!, 0) /
          ratedRequests.length
        ).toFixed(1)
      : null;

  // Recent activity (first names only for privacy)
  const recentActivity = allRequests.slice(0, 20).map((r) => ({
    firstName: r.customer_name.split(/\s+/)[0],
    status: r.status,
    rating: r.rating_clicked,
    date: r.created_at,
  }));

  return NextResponse.json({
    client: {
      name: client.name,
      brandColor: client.brand_color,
      logoUrl: client.logo_url,
    },
    stats: {
      totalSent,
      openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
      clickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
      avgRating,
    },
    distribution,
    recentActivity,
  });
}
