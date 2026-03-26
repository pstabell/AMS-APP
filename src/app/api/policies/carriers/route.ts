import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEMO_EMAIL = "demo@agentcommissiontracker.com";

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const userEmail = request.headers.get("x-user-email") || DEMO_EMAIL;

  try {
    const { data, error } = await supabase
      .from("policies")
      .select("*")
      .eq("user_email", userEmail);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get unique carriers
    const carriers = [...new Set((data ?? [])
      .map((r: any) => r["Carrier Name"])
      .filter((c: string | null) => c && c !== "—")
    )].sort();

    return NextResponse.json({ data: carriers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unable to load carriers." }, { status: 500 });
  }
}
