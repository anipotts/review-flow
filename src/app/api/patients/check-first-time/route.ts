import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface PatientInput {
  name: string;
  email: string;
}

export async function POST(request: Request) {
  const { clientId, patients } = (await request.json()) as {
    clientId: string;
    patients: PatientInput[];
  };

  if (!clientId || !patients || !Array.isArray(patients)) {
    return NextResponse.json(
      { error: "clientId and patients array are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const firstTime: PatientInput[] = [];
  const existing: PatientInput[] = [];

  for (const patient of patients) {
    const email = patient.email.toLowerCase().trim();
    const nameParts = patient.name.trim().split(/\s+/);
    const firstName = nameParts[0] || null;
    const lastName = nameParts.slice(1).join(" ") || null;

    // INSERT ON CONFLICT DO NOTHING — if row returned, it's a new patient
    const { data } = await supabase
      .from("patients")
      .insert({
        client_id: clientId,
        email,
        first_name: firstName,
        last_name: lastName,
        source: "csv",
      })
      .select("id")
      .single();

    if (data) {
      firstTime.push(patient);
    } else {
      existing.push(patient);
    }
  }

  return NextResponse.json({ firstTime, existing });
}
