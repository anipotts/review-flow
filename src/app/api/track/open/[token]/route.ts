import { NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 1x1 transparent GIF pixel
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  after(async () => {
    const supabase = await createClient();

    // Find review request by token
    const { data: reviewRequest } = await supabase
      .from("review_requests")
      .select("id, status, opened_at")
      .eq("token", token)
      .single();

    if (!reviewRequest) return;

    // Set opened_at if not already set, update status from 'sent' to 'opened'
    if (!reviewRequest.opened_at) {
      await supabase
        .from("review_requests")
        .update({
          opened_at: new Date().toISOString(),
          status: reviewRequest.status === "sent" ? "opened" : reviewRequest.status,
        })
        .eq("id", reviewRequest.id);
    }

    // Always log the open event
    await supabase.from("email_opens").insert({
      review_request_id: reviewRequest.id,
    });
  });

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
