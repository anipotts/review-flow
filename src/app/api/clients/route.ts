import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, slug, google_place_id, website_url, contact_page_url, brand_color, logo_url } = body;

  if (!name || !slug || !google_place_id || !website_url) {
    return NextResponse.json(
      { error: "Missing required fields: Client Name, Slug, Google Place ID, and Website URL." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) {
    return NextResponse.json({ error: "This slug is already taken. Choose a different URL identifier." }, { status: 409 });
  }

  // Auto-generate share token
  const shareToken = nanoid(16);

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      slug,
      google_place_id,
      website_url,
      contact_page_url: contact_page_url || `${website_url}/contact`,
      brand_color: brand_color || "#2563EB",
      logo_url: logo_url || null,
      share_token: shareToken,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
