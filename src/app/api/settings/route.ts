import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAllSettings, clearSettingsCache } from "@/lib/settings";

const SENSITIVE_KEYS = ["RESEND_API_KEY", "ACUITY_API_KEY", "ADMIN_PASSWORD"];

function maskValue(value: string): string {
  if (value.length <= 4) return "****";
  return "****" + value.slice(-4);
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  const settings = await getAllSettings();

  const masked: Record<string, { value: string; configured: boolean; masked: boolean }> = {};
  for (const [key, value] of Object.entries(settings)) {
    if (SENSITIVE_KEYS.includes(key)) {
      masked[key] = { value: maskValue(value), configured: true, masked: true };
    } else {
      masked[key] = { value, configured: true, masked: false };
    }
  }

  return NextResponse.json(masked);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { settings } = body as { settings: Record<string, string> };

  if (!settings || typeof settings !== "object") {
    return NextResponse.json({ error: "settings object required" }, { status: 400 });
  }

  const supabase = getSupabase();

  for (const [key, value] of Object.entries(settings)) {
    if (!value || typeof value !== "string") continue;
    // Skip masked values (user didn't change the field)
    if (value.startsWith("****")) continue;

    await supabase.from("app_settings").upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
  }

  clearSettingsCache();

  return NextResponse.json({ success: true });
}
