import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateToken } from "@/lib/tokens";
import { getResend } from "@/lib/resend";
import { ReviewRequestEmail } from "@/emails/review-request";
import { isAcuityEnabled, getAppointments } from "@/lib/acuity";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAcuityEnabled()) {
    return NextResponse.json({
      message: "Acuity disabled — use CSV upload instead",
      processed: 0,
    });
  }

  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const results: Array<{
    clientName: string;
    appointmentsFound: number;
    newPatients: number;
    emailsSent: number;
  }> = [];

  // Get all active clients with Acuity calendar IDs
  const { data: clients } = await supabase
    .from("clients")
    .select("*, locations(*)")
    .eq("is_active", true)
    .eq("auto_send_enabled", true);

  if (!clients || clients.length === 0) {
    return NextResponse.json({ message: "No clients with auto-send enabled", results });
  }

  // Date range: past 7 days
  const now = new Date();
  const weekEnd = now.toISOString().split("T")[0];
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  for (const client of clients) {
    const calendarIds: number[] = client.acuity_calendar_ids || [];
    if (calendarIds.length === 0) continue;

    // Build calendarID -> location mapping
    const calendarLocationMap = new Map<number, string>();
    const clientLocations = client.locations || [];
    for (const loc of clientLocations) {
      for (const calId of loc.acuity_calendar_ids || []) {
        calendarLocationMap.set(calId, loc.id);
      }
    }

    // Fetch appointments from all calendars
    let allAppointments: Awaited<ReturnType<typeof getAppointments>> = [];
    for (const calId of calendarIds) {
      try {
        const appointments = await getAppointments({
          minDate: weekStart,
          maxDate: weekEnd,
          calendarID: calId,
        });
        allAppointments.push(...appointments);
      } catch {
        // Continue with other calendars on failure
      }
    }

    // Deduplicate by email
    const uniquePatients = new Map<
      string,
      { name: string; email: string; calendarID: number }
    >();
    for (const apt of allAppointments) {
      const email = apt.email.toLowerCase().trim();
      if (!uniquePatients.has(email)) {
        uniquePatients.set(email, {
          name: `${apt.firstName} ${apt.lastName}`.trim(),
          email,
          calendarID: apt.calendarID,
        });
      }
    }

    // First-time detection
    const newPatients: Array<{
      name: string;
      email: string;
      calendarID: number;
    }> = [];

    for (const patient of uniquePatients.values()) {
      const { data } = await supabase
        .from("patients")
        .insert({
          client_id: client.id,
          email: patient.email,
          first_name: patient.name.split(/\s+/)[0] || null,
          last_name: patient.name.split(/\s+/).slice(1).join(" ") || null,
          source: "acuity_auto",
        })
        .select("id")
        .single();

      if (data) {
        newPatients.push(patient);
      }
    }

    // Create send batch
    const { data: batch } = await supabase
      .from("send_batches")
      .insert({
        client_id: client.id,
        week_start: weekStart,
        week_end: weekEnd,
        total_new: newPatients.length,
        status: "processing",
      })
      .select()
      .single();

    // Send emails to new patients
    let emailsSent = 0;
    const fromName = client.email_from_name || "ReviewFlow";
    const fromEmail =
      (process.env.EMAIL_FROM || "ReviewFlow <feedback@dadadigital.com>").match(
        /<(.+)>/
      )?.[1] || "feedback@dadadigital.com";

    for (const patient of newPatients) {
      const token = generateToken();
      const locationId = calendarLocationMap.get(patient.calendarID) || null;

      // Create review request
      const { data: reviewRequest } = await supabase
        .from("review_requests")
        .insert({
          client_id: client.id,
          customer_name: patient.name,
          customer_email: patient.email,
          token,
          status: "pending",
          location_id: locationId,
          batch_id: batch?.id || null,
          source: "acuity_auto",
        })
        .select()
        .single();

      if (!reviewRequest) continue;

      // Send email
      try {
        const { error } = await getResend().emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: patient.email,
          subject: `How was your experience with ${client.name}?`,
          react: ReviewRequestEmail({
            customerName: patient.name.split(/\s+/)[0] || patient.name,
            clientName: client.name,
            clientLogoUrl: client.logo_url || undefined,
            brandColor: client.brand_color,
            baseUrl,
            token,
          }),
        });

        if (!error) {
          await supabase
            .from("review_requests")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", reviewRequest.id);
          emailsSent++;
        }
      } catch {
        // Continue on send failure
      }
    }

    // Update batch
    if (batch) {
      await supabase
        .from("send_batches")
        .update({ total_sent: emailsSent, status: "completed" })
        .eq("id", batch.id);
    }

    results.push({
      clientName: client.name,
      appointmentsFound: uniquePatients.size,
      newPatients: newPatients.length,
      emailsSent,
    });
  }

  return NextResponse.json({ message: "Weekly review cron completed", results });
}
