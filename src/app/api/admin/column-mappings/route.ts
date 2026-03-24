import { NextRequest, NextResponse } from "next/server";
import { validateServerSession } from "@/lib/server-auth";
import { 
  getColumnMappings, 
  createColumnMapping, 
  updateColumnMapping, 
  deleteColumnMapping,
  DEFAULT_COLUMN_MAPPING,
  POLICY_FIELDS 
} from "@/lib/column-mappings";

export async function GET(request: NextRequest) {
  // SECURITY FIX: Validate session instead of trusting spoofable headers
  const { user, error: authError } = await validateServerSession(request);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;
  
  

  const { data, error } = await getColumnMappings(userId);
  
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ 
    data,
    policyFields: POLICY_FIELDS,
    defaultMapping: DEFAULT_COLUMN_MAPPING,
  });
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
    const { data, error } = await createColumnMapping({
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
      return NextResponse.json({ error: "Mapping ID is required" }, { status: 400 });
    }

    const { data, error } = await updateColumnMapping(id, userId, updates);

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
    return NextResponse.json({ error: "Mapping ID is required" }, { status: 400 });
  }

  const { error } = await deleteColumnMapping(id, userId);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
