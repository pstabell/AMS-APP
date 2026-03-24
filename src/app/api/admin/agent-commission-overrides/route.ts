import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateServerSession } from "@/lib/server-auth";

export type AgentCommissionOverride = {
  id: string;
  agent_id: string;
  transaction_type: string;
  carrier_id: string | null;
  mga_name: string | null;
  override_rate: number;
  effective_from: string;
  effective_to: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  agent?: { first_name: string; last_name: string; email: string; };
  carrier?: { name: string; code: string; };
  created_by_user?: { email: string; };
  approved_by_user?: { email: string; };
};

export type AgentCommissionOverrideInput = {
  agent_id: string;
  transaction_type: string;
  carrier_id?: string;
  mga_name?: string;
  override_rate: number;
  effective_from: string;
  effective_to?: string;
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
  const agentId = searchParams.get("agent_id");
  const status = searchParams.get("status");
  const transactionType = searchParams.get("transaction_type");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    let query = supabase
      .from("agent_commission_overrides")
      .select(`
        *,
        agent:agents(first_name, last_name, email),
        carrier:carriers(name, code),
        created_by_user:profiles!agent_commission_overrides_created_by_fkey(email),
        approved_by_user:profiles!agent_commission_overrides_approved_by_fkey(email)
      `)
      .or(`created_by.eq.${user.id},approved_by.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (agentId) {
      query = query.eq("agent_id", agentId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (transactionType) {
      query = query.eq("transaction_type", transactionType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: formatError(error) }, { status: 500 });
    }

    return NextResponse.json({ data: data as AgentCommissionOverride[] });
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
    const body: AgentCommissionOverrideInput = await request.json();

    // Validate effective_from is not in the past
    const effectiveFrom = new Date(body.effective_from);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (effectiveFrom < today) {
      return NextResponse.json({
        error: "Effective date cannot be in the past"
      }, { status: 400 });
    }

    // Validate effective_to is after effective_from if provided
    if (body.effective_to) {
      const effectiveTo = new Date(body.effective_to);
      if (effectiveTo <= effectiveFrom) {
        return NextResponse.json({
          error: "Effective to date must be after effective from date"
        }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from("agent_commission_overrides")
      .insert({
        ...body,
        created_by: user.id,
      })
      .select(`
        *,
        agent:agents(first_name, last_name, email),
        carrier:carriers(name, code),
        created_by_user:profiles!agent_commission_overrides_created_by_fkey(email)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: formatError(error) }, { status: 400 });
    }

    return NextResponse.json({ data: data as AgentCommissionOverride }, { status: 201 });
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

    // Validate dates if being updated
    if (updatePayload.effective_from || updatePayload.effective_to) {
      const effectiveFrom = new Date(updatePayload.effective_from);

      if (updatePayload.effective_to) {
        const effectiveTo = new Date(updatePayload.effective_to);
        if (effectiveTo <= effectiveFrom) {
          return NextResponse.json({
            error: "Effective to date must be after effective from date"
          }, { status: 400 });
        }
      }
    }

    const { data, error } = await supabase
      .from("agent_commission_overrides")
      .update(updatePayload)
      .eq("id", id)
      .or(`created_by.eq.${user.id},approved_by.eq.${user.id}`)
      .select(`
        *,
        agent:agents(first_name, last_name, email),
        carrier:carriers(name, code),
        created_by_user:profiles!agent_commission_overrides_created_by_fkey(email),
        approved_by_user:profiles!agent_commission_overrides_approved_by_fkey(email)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: formatError(error) }, { status: 400 });
    }

    return NextResponse.json({ data: data as AgentCommissionOverride });
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
    // Only allow deletion of pending overrides by the creator
    const { error } = await supabase
      .from("agent_commission_overrides")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id)
      .eq("status", "pending");

    if (error) {
      return NextResponse.json({ error: formatError(error) }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: formatError(err) }, { status: 500 });
  }
}
