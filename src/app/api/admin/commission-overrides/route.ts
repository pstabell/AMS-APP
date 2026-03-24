import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateServerSession } from "@/lib/server-auth";

export type CommissionOverride = {
  id: string;
  policy_id: string;
  agent_id: string | null;
  original_rate: number;
  override_rate: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  policy?: { policy_number: string; customer: string; };
  agent?: { first_name: string; last_name: string; };
  created_by_user?: { email: string; };
  approved_by_user?: { email: string; };
};

export type CommissionOverrideInput = {
  policy_id: string;
  agent_id?: string;
  original_rate: number;
  override_rate: number;
  reason: string;
};

function formatError(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export async function GET(request: NextRequest) {
  // SECURITY FIX: Validate session instead of trusting spoofable headers
  const { user, error: authError } = await validateServerSession(request);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const policyId = searchParams.get("policy_id");
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    let query = supabase
      .from("commission_overrides")
      .select(`
        *,
        policy:policies(policy_number, customer),
        agent:agents(first_name, last_name),
        created_by_user:profiles!commission_overrides_created_by_fkey(email),
        approved_by_user:profiles!commission_overrides_approved_by_fkey(email)
      `)
      .or(`created_by.eq.${user.id},approved_by.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (policyId) {
      query = query.eq("policy_id", policyId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: formatError(error) }, { status: 500 });
    }

    return NextResponse.json({ data: data as CommissionOverride[] });
  } catch (err) {
    return NextResponse.json({ error: formatError(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // SECURITY FIX: Validate session instead of trusting spoofable headers
  const { user, error: authError } = await validateServerSession(request);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: CommissionOverrideInput = await request.json();

    const { data, error } = await supabase
      .from("commission_overrides")
      .insert({
        ...body,
        created_by: user.id,
      })
      .select(`
        *,
        policy:policies(policy_number, customer),
        agent:agents(first_name, last_name),
        created_by_user:profiles!commission_overrides_created_by_fkey(email)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: formatError(error) }, { status: 400 });
    }

    return NextResponse.json({ data: data as CommissionOverride }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: formatError(err) }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  // SECURITY FIX: Validate session instead of trusting spoofable headers
  const { user, error: authError } = await validateServerSession(request);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, rejection_reason, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Override ID is required" }, { status: 400 });
    }

    // Prepare update payload
    const updatePayload: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Handle approval/rejection
    if (status) {
      updatePayload.status = status;

      if (status === 'approved') {
        updatePayload.approved_by = user.id;
        updatePayload.approved_at = new Date().toISOString();
      } else if (status === 'rejected' && rejection_reason) {
        updatePayload.rejection_reason = rejection_reason;
        updatePayload.approved_by = user.id;
        updatePayload.approved_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from("commission_overrides")
      .update(updatePayload)
      .eq("id", id)
      .or(`created_by.eq.${user.id},approved_by.eq.${user.id}`)
      .select(`
        *,
        policy:policies(policy_number, customer),
        agent:agents(first_name, last_name),
        created_by_user:profiles!commission_overrides_created_by_fkey(email),
        approved_by_user:profiles!commission_overrides_approved_by_fkey(email)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: formatError(error) }, { status: 400 });
    }

    return NextResponse.json({ data: data as CommissionOverride });
  } catch (err) {
    return NextResponse.json({ error: formatError(err) }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  // SECURITY FIX: Validate session instead of trusting spoofable headers
  const { user, error: authError } = await validateServerSession(request);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Override ID is required" }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from("commission_overrides")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) {
      return NextResponse.json({ error: formatError(error) }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: formatError(err) }, { status: 500 });
  }
}
