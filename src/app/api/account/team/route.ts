import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key);
}

// GET /api/account/team?agencyId=xxx
// Returns all agents for an agency
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agencyId = searchParams.get("agencyId");

  if (!agencyId) {
    return NextResponse.json({ error: "agencyId required" }, { status: 400 });
  }

  const supabase = getSupabase();

  try {
    const { data, error } = await supabase
      .from("agents")
      .select("id, user_id, name, email, role, is_active, created_at, updated_at")
      .eq("agency_id", agencyId)
      .order("role", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Team fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agents: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/account/team — Add a new agent
// Body: { agencyId, name, email, role }
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { agencyId, name, email, role } = body;

  if (!agencyId || !name || !email) {
    return NextResponse.json({ error: "agencyId, name, and email are required" }, { status: 400 });
  }

  const validRoles = ["owner", "administrator", "manager", "agent"];
  const agentRole = validRoles.includes(role) ? role : "agent";

  const supabase = getSupabase();

  try {
    // Check if a user account exists for this email
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email")
      .ilike("email", email.trim().toLowerCase())
      .maybeSingle();

    // Use existing user_id if found, otherwise generate a placeholder
    // (the agent can create their account later and it will link up)
    const userId = existingUser?.id ?? crypto.randomUUID();

    // Check for duplicate in this agency
    const { data: existingAgent } = await supabase
      .from("agents")
      .select("id")
      .eq("agency_id", agencyId)
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (existingAgent) {
      return NextResponse.json({ error: "An agent with this email already exists in your agency." }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("agents")
      .insert({
        agency_id: agencyId,
        user_id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: agentRole,
        is_active: true,
      })
      .select("id, user_id, name, email, role, is_active, created_at")
      .single();

    if (error) {
      console.error("Agent insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agent: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/account/team — Update an agent
// Body: { agentId, role?, is_active?, name? }
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { agentId, ...updates } = body;

  if (!agentId) {
    return NextResponse.json({ error: "agentId required" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Build update object (only allow safe fields)
  const safeUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
  if (typeof updates.role === "string") {
    const validRoles = ["owner", "administrator", "manager", "agent"];
    if (validRoles.includes(updates.role)) safeUpdate.role = updates.role;
  }
  if (typeof updates.is_active === "boolean") safeUpdate.is_active = updates.is_active;
  if (typeof updates.name === "string") safeUpdate.name = updates.name.trim();

  try {
    const { data, error } = await supabase
      .from("agents")
      .update(safeUpdate)
      .eq("id", agentId)
      .select("id, user_id, name, email, role, is_active, updated_at")
      .single();

    if (error) {
      console.error("Agent update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agent: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
