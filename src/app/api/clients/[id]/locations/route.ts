import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("client_id", id)
    .order("created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, google_place_id, contact_page_url, acuity_calendar_ids, is_default } = body;

  if (!name || !google_place_id || !contact_page_url) {
    return NextResponse.json(
      { error: "name, google_place_id, and contact_page_url are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // If setting as default, unset other defaults first
  if (is_default) {
    await supabase
      .from("locations")
      .update({ is_default: false })
      .eq("client_id", id);
  }

  const { data, error } = await supabase
    .from("locations")
    .insert({
      client_id: id,
      name,
      google_place_id,
      contact_page_url,
      acuity_calendar_ids: acuity_calendar_ids || [],
      is_default: is_default || false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { locations } = body as {
    locations: Array<{
      id?: string;
      name: string;
      google_place_id: string;
      contact_page_url: string;
      acuity_calendar_ids?: number[];
      is_default?: boolean;
    }>;
  };

  if (!locations || !Array.isArray(locations)) {
    return NextResponse.json(
      { error: "locations array is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Delete existing locations for this client
  await supabase.from("locations").delete().eq("client_id", id);

  // Insert new locations
  if (locations.length > 0) {
    const { error } = await supabase.from("locations").insert(
      locations.map((loc) => ({
        client_id: id,
        name: loc.name,
        google_place_id: loc.google_place_id,
        contact_page_url: loc.contact_page_url,
        acuity_calendar_ids: loc.acuity_calendar_ids || [],
        is_default: loc.is_default || false,
      }))
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Fetch updated locations
  const { data } = await supabase
    .from("locations")
    .select("*")
    .eq("client_id", id)
    .order("created_at");

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId");

  if (!locationId) {
    return NextResponse.json(
      { error: "locationId query param is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", locationId)
    .eq("client_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
