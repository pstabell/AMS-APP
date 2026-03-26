import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ role: "agent", agency_id: null, agency_name: null, agent_id: null });
  }

  try {
    const supabase = createServerClient();

    const { data: agentRow, error } = await supabase
      .from("agents")
      .select("id, agency_id, role, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error || !agentRow) {
      return NextResponse.json({ role: "agent", agency_id: null, agency_name: null, agent_id: null });
    }

    const { data: agencyRow } = await supabase
      .from("agencies")
      .select("id, agency_name")
      .eq("id", agentRow.agency_id)
      .maybeSingle();

    return NextResponse.json({
      role: agentRow.role || "agent",
      agency_id: agentRow.agency_id,
      agency_name: agencyRow?.agency_name ?? null,
      agent_id: agentRow.id,
    });
  } catch {
    return NextResponse.json({ role: "agent", agency_id: null, agency_name: null, agent_id: null });
  }
}
