import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { validateServerSession } from "@/lib/server-auth";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function GET(request: NextRequest) {
  // SECURITY FIX: Validate session instead of trusting spoofable headers
  const { user, error: authError } = await validateServerSession(request);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const sanitized = (data ?? []).map((row: any) => {
      const { password_hash, ...rest } = row;
      return rest;
    });

    return NextResponse.json({ data: sanitized });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // SECURITY FIX: Validate session instead of trusting spoofable headers
  const { user, error: authError } = await validateServerSession(request);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const email = body.email ? normalizeEmail(body.email) : "";
    const password = body.password ? String(body.password) : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const payload: Record<string, any> = {
      id: crypto.randomUUID(),
      email,
      subscription_status: body.subscription_status || "inactive",
      password_hash: hashedPassword,
      password_set: Boolean(password),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (body.role) {
      payload.role = body.role;
    }

    const supabase = createServerClient();
    const { data, error } = await supabase.from("users").insert(payload).select("*").single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { password_hash, ...rest } = data as any;
    return NextResponse.json({ data: rest }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request body" },
      { status: 400 }
    );
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.email) {
      payload.email = normalizeEmail(updates.email);
    }
    if (typeof updates.subscription_status === "string") {
      payload.subscription_status = updates.subscription_status;
    }
    if (typeof updates.role === "string") {
      payload.role = updates.role;
    }
    if (updates.password) {
      payload.password_hash = await bcrypt.hash(String(updates.password), 10);
      payload.password_set = true;
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("users")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { password_hash, ...rest } = data as any;
    return NextResponse.json({ data: rest });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request body" },
      { status: 400 }
    );
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
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete user" },
      { status: 500 }
    );
  }
}
