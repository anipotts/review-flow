import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateToken } from "@/lib/tokens";
import { getResend } from "@/lib/resend";
import { getSetting } from "@/lib/settings";
import { ReviewRequestEmail } from "@/emails/review-request";

export async function POST(request: Request) {
  const { testEmail, clientId } = await request.json();

  if (!testEmail) {
    return NextResponse.json({ error: "Please enter an email address to send the test to." }, { status: 400 });
  }

  const supabase = await createClient();

  // Use specified client or first active client
  let client;
  if (clientId) {
    const { data } = await supabase.from("clients").select("*").eq("id", clientId).single();
    client = data;
  } else {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("is_active", true)
      .order("name")
      .limit(1)
      .single();
    client = data;
  }

  if (!client) {
    return NextResponse.json({ error: "No active clients found. Create a client before sending a test." }, { status: 404 });
  }

  const token = generateToken();

  // Create review request with test source
  const { data: reviewRequest, error: insertError } = await supabase
    .from("review_requests")
    .insert({
      client_id: client.id,
      customer_name: "Test User",
      customer_email: testEmail,
      token,
      status: "pending",
      source: "test",
    })
    .select()
    .single();

  if (insertError || !reviewRequest) {
    return NextResponse.json({ error: "Failed to create test review request. Please try again." }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fromName = client.email_from_name || "MaMaDigital";
  const emailFrom = await getSetting("EMAIL_FROM") || "ReviewFlow <feedback@dadadigital.com>";
  const fromEmail = emailFrom.match(/<(.+)>/)?.[1] || "feedback@dadadigital.com";

  const resend = await getResend();
  const { error: emailError } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: testEmail,
    subject: `[TEST] How was your experience with ${client.name}?`,
    react: ReviewRequestEmail({
      customerName: "Test User",
      clientName: client.name,
      clientLogoUrl: client.logo_url || undefined,
      brandColor: client.brand_color,
      baseUrl,
      token,
    }),
  });

  if (emailError) {
    const hint = emailError.message?.toLowerCase().includes("api key")
      ? "Check your Resend API key in Settings."
      : "Verify your email configuration in Settings (API key, sender domain, etc.).";
    return NextResponse.json({ error: `Failed to send test email: ${emailError.message}. ${hint}` }, { status: 500 });
  }

  await supabase
    .from("review_requests")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", reviewRequest.id);

  return NextResponse.json({ success: true, requestId: reviewRequest.id });
}
