import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");

  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Future: Handle Acuity appointment webhooks
  // Parse payload, auto-send review requests after appointments
  const body = await request.json();
  console.log("Webhook received:", body);

  return NextResponse.json({ success: true });
}
