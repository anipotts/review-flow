import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = await createClient();

  // Build click events query
  let clickQuery = supabase
    .from("click_events")
    .select("*, review_requests!inner(*, clients!inner(name))")
    .order("clicked_at", { ascending: false });

  if (clientId) {
    clickQuery = clickQuery.eq("review_requests.client_id", clientId);
  }
  if (from) {
    clickQuery = clickQuery.gte("clicked_at", from);
  }
  if (to) {
    clickQuery = clickQuery.lte("clicked_at", `${to}T23:59:59`);
  }

  const { data: clicks, error } = await clickQuery.limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build stats
  let requestsQuery = supabase
    .from("review_requests")
    .select("id, status, opened_at, source, location_id", { count: "exact" });

  if (clientId) {
    requestsQuery = requestsQuery.eq("client_id", clientId);
  }
  if (from) {
    requestsQuery = requestsQuery.gte("created_at", from);
  }
  if (to) {
    requestsQuery = requestsQuery.lte("created_at", `${to}T23:59:59`);
  }

  const { data: requests, count: totalRequests } = await requestsQuery;

  const totalSent =
    requests?.filter((r) => r.status !== "pending").length || 0;
  const totalClicked =
    requests?.filter((r) => r.status === "clicked").length || 0;
  const totalOpened =
    requests?.filter((r) => r.opened_at !== null).length || 0;

  // Rating distribution
  const distribution = [0, 0, 0, 0, 0];
  (clicks || []).forEach((c) => {
    if (c.rating >= 1 && c.rating <= 5) {
      distribution[c.rating - 1]++;
    }
  });

  const totalClicksCount = clicks?.length || 0;
  const fiveStarClicks = distribution[4];

  // Source breakdown
  const sourceBreakdown: Record<string, number> = {};
  (requests || []).forEach((r) => {
    const src = r.source || "manual";
    sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
  });

  // Location breakdown (for multi-location clients)
  const locationBreakdown: Record<string, { sent: number; clicked: number; opened: number }> = {};
  if (clientId) {
    (requests || []).forEach((r) => {
      const locId = r.location_id || "default";
      if (!locationBreakdown[locId]) {
        locationBreakdown[locId] = { sent: 0, clicked: 0, opened: 0 };
      }
      if (r.status !== "pending") locationBreakdown[locId].sent++;
      if (r.status === "clicked") locationBreakdown[locId].clicked++;
      if (r.opened_at) locationBreakdown[locId].opened++;
    });
  }

  return NextResponse.json({
    totalRequests: totalRequests || 0,
    totalSent,
    totalClicked,
    totalOpened,
    clickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
    openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
    fiveStarRate:
      totalClicksCount > 0
        ? Math.round((fiveStarClicks / totalClicksCount) * 100)
        : 0,
    avgRating:
      clicks && clicks.length > 0
        ? (
            clicks.reduce((sum, c) => sum + c.rating, 0) / clicks.length
          ).toFixed(1)
        : null,
    distribution,
    sourceBreakdown,
    locationBreakdown,
    clicks: clicks || [],
  });
}
