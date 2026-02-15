import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .eq("client_id", id)
    .eq("is_active", true)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { providers } = body as {
    providers: Array<{
      id?: string;
      name: string;
      display_name: string;
      google_place_id?: string;
      npi?: string;
    }>;
  };

  if (!providers || !Array.isArray(providers)) {
    return NextResponse.json(
      { error: "providers array is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Delete existing providers for this client
  await supabase.from("providers").delete().eq("client_id", id);

  // Insert new providers
  if (providers.length > 0) {
    const { error } = await supabase.from("providers").insert(
      providers.map((p) => ({
        client_id: id,
        name: p.name,
        display_name: p.display_name,
        google_place_id: p.google_place_id || null,
        npi: p.npi || null,
      }))
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Fetch updated providers
  const { data } = await supabase
    .from("providers")
    .select("*")
    .eq("client_id", id)
    .order("name");

  return NextResponse.json(data);
}
