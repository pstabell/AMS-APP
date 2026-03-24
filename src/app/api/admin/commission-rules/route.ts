import { NextRequest, NextResponse } from "next/server";
import { validateServerSession } from "@/lib/server-auth";
import { 
  getCommissionRules, 
  createCommissionRule, 
  updateCommissionRule, 
  deleteCommissionRule,
  DEFAULT_COMMISSION_RULES 
} from "@/lib/commission-rules";

export async function GET(request: NextRequest) {
  // SECURITY FIX: Validate session instead of trusting spoofable headers
  const { user, error: authError } = await validateServerSession(request);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;
  
  

  const { data, error } = await getCommissionRules(userId);
  
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  // If no rules exist, return defaults for display
  if (data.length === 0) {
    return NextResponse.json({ 
      data: DEFAULT_COMMISSION_RULES.map((rule, idx) => ({
        id: `default-${idx}`,
        ...rule,
        condition_operator: null,
        priority: idx,
        active: true,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
      isDefault: true 
    });
  }

  return NextResponse.json({ data, isDefault: false });
}

export async function POST(request: NextRequest) {
  // SECURITY FIX: Validate session instead of trusting spoofable headers
  const { user, error: authError } = await validateServerSession(request);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;
  
  

  try {
    const body = await request.json();
    
    // Handle seeding default rules
    if (body.seedDefaults) {
      const results = [];
      for (const rule of DEFAULT_COMMISSION_RULES) {
        const { data, error } = await createCommissionRule({
          ...rule,
          user_id: userId,
        });
        if (data) results.push(data);
      }
      return NextResponse.json({ data: results }, { status: 201 });
    }
    
    const { data, error } = await createCommissionRule({
      ...body,
      user_id: userId,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  // SECURITY FIX: Validate session instead of trusting spoofable headers
  const { user, error: authError } = await validateServerSession(request);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;
  
  

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 });
    }

    const { data, error } = await updateCommissionRule(id, userId, updates);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  // SECURITY FIX: Validate session instead of trusting spoofable headers
  const { user, error: authError } = await validateServerSession(request);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;
  
  

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Rule ID is required" }, { status: 400 });
  }

  const { error } = await deleteCommissionRule(id, userId);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
