import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateToken } from "@/lib/tokens";
import { getResend } from "@/lib/resend";
import { ReviewRequestEmail } from "@/emails/review-request";

export async function POST(request: Request) {
  const { clientId, customerName, customerEmail, locationId, source } =
    await request.json();

  if (!clientId || !customerName || !customerEmail) {
    return NextResponse.json(
      { error: "clientId, customerName, and customerEmail are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Fetch client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Generate token and create review request
  const token = generateToken();

  const { data: reviewRequest, error: insertError } = await supabase
    .from("review_requests")
    .insert({
      client_id: clientId,
      customer_name: customerName,
      customer_email: customerEmail,
      token,
      status: "pending",
      location_id: locationId || null,
      source: source || "manual",
    })
    .select()
    .single();

  if (insertError || !reviewRequest) {
    return NextResponse.json(
      { error: "Failed to create review request" },
      { status: 500 }
    );
  }

  // Record patient
  const email = customerEmail.toLowerCase().trim();
  const nameParts = customerName.trim().split(/\s+/);
  await supabase.from("patients").upsert(
    {
      client_id: clientId,
      email,
      first_name: nameParts[0] || null,
      last_name: nameParts.slice(1).join(" ") || null,
      source: source || "manual",
    },
    { onConflict: "client_id,email", ignoreDuplicates: true }
  );

  // Send email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fromName = client.email_from_name || "ReviewFlow";
  const fromEmail = (process.env.EMAIL_FROM || "ReviewFlow <feedback@dadadigital.com>")
    .match(/<(.+)>/)?.[1] || "feedback@dadadigital.com";

  const { error: emailError } = await getResend().emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: customerEmail,
    subject: `How was your experience with ${client.name}?`,
    react: ReviewRequestEmail({
      customerName,
      clientName: client.name,
      clientLogoUrl: client.logo_url || undefined,
      brandColor: client.brand_color,
      baseUrl,
      token,
    }),
  });

  if (emailError) {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }

  // Update status to sent
  await supabase
    .from("review_requests")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", reviewRequest.id);

  return NextResponse.json({ success: true, requestId: reviewRequest.id });
}
