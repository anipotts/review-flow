import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateToken } from "@/lib/tokens";
import { getResend } from "@/lib/resend";
import { getSetting } from "@/lib/settings";
import { getAppointmentById } from "@/lib/acuity";
import { ReviewRequestEmail } from "@/emails/review-request";

export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");

  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, id, calendarID, appointmentTypeID } = body;

  // Only process scheduled appointments
  if (action !== "scheduled" || !id) {
    return NextResponse.json({ success: true, skipped: true });
  }

  const supabase = await createClient();

  // Fetch full appointment details from Acuity
  let appointment;
  try {
    appointment = await getAppointmentById(id);
  } catch {
    return NextResponse.json({ error: "Failed to fetch appointment" }, { status: 500 });
  }

  if (!appointment.email) {
    return NextResponse.json({ success: true, skipped: true, reason: "no email" });
  }

  // Match calendarID to a client
  const { data: clients } = await supabase
    .from("clients")
    .select("*, locations(*)")
    .eq("is_active", true)
    .contains("acuity_calendar_ids", [calendarID]);

  const client = clients?.[0];
  if (!client) {
    return NextResponse.json({ success: true, skipped: true, reason: "no matching client" });
  }

  // Check appointment type filter (if configured)
  const typeIds: number[] = client.acuity_appointment_type_ids || [];
  if (typeIds.length > 0 && !typeIds.includes(appointmentTypeID)) {
    return NextResponse.json({ success: true, skipped: true, reason: "appointment type filtered" });
  }

  // Find matching location
  const locations = client.locations || [];
  let locationId: string | null = null;
  for (const loc of locations) {
    if ((loc.acuity_calendar_ids || []).includes(calendarID)) {
      locationId = loc.id;
      break;
    }
  }

  // First-time patient check (INSERT ON CONFLICT does nothing for existing)
  const email = appointment.email.toLowerCase().trim();
  const { data: patientInsert } = await supabase
    .from("patients")
    .insert({
      client_id: client.id,
      email,
      first_name: appointment.firstName || null,
      last_name: appointment.lastName || null,
      source: "acuity_webhook",
    })
    .select("id")
    .single();

  if (!patientInsert) {
    // Patient already exists — don't send duplicate
    return NextResponse.json({ success: true, skipped: true, reason: "existing patient" });
  }

  // Create review request
  const token = generateToken();
  const { data: reviewRequest } = await supabase
    .from("review_requests")
    .insert({
      client_id: client.id,
      customer_name: `${appointment.firstName} ${appointment.lastName}`.trim(),
      customer_email: email,
      token,
      status: "pending",
      location_id: locationId,
      source: "acuity_webhook",
    })
    .select()
    .single();

  if (!reviewRequest) {
    return NextResponse.json({ error: "Failed to create review request" }, { status: 500 });
  }

  // Send email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fromName = client.email_from_name || "MaMaDigital";
  const emailFrom = await getSetting("EMAIL_FROM") || "MaMaDigital <feedback@dadadigital.com>";
  const fromEmail = emailFrom.match(/<(.+)>/)?.[1] || "feedback@dadadigital.com";

  const resend = await getResend();
  const { error: emailError } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: email,
    subject: `How was your experience with ${client.name}?`,
    react: ReviewRequestEmail({
      customerName: appointment.firstName || appointment.lastName || "there",
      clientName: client.name,
      clientLogoUrl: client.logo_url || undefined,
      brandColor: client.brand_color,
      baseUrl,
      token,
    }),
  });

  if (emailError) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  await supabase
    .from("review_requests")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", reviewRequest.id);

  return NextResponse.json({ success: true, requestId: reviewRequest.id });
}
