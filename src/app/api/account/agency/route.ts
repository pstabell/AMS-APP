import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key);
}

// GET /api/account/agency?agencyId=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agencyId = searchParams.get("agencyId");

  if (!agencyId) {
    return NextResponse.json({ error: "agencyId required" }, { status: 400 });
  }

  const supabase = getSupabase();

  try {
    const { data, error } = await supabase
      .from("agencies")
      .select("*")
      .eq("id", agencyId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    return NextResponse.json({ agency: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/account/agency — Update agency profile
// Body: { agencyId, agency_name?, email?, phone?, website?, address_*, license_number?, tax_id? }
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { agencyId, ...updates } = body;

  if (!agencyId) {
    return NextResponse.json({ error: "agencyId required" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Only allow safe fields
  const allowedFields = [
    "agency_name", "email", "phone", "website",
    "address_street", "address_city", "address_state", "address_zip",
    "license_number", "tax_id",
  ];

  const safeUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const key of allowedFields) {
    if (typeof updates[key] === "string") {
      safeUpdate[key] = updates[key].trim();
    }
  }

  try {
    const { data, error } = await supabase
      .from("agencies")
      .update(safeUpdate)
      .eq("id", agencyId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agency: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
