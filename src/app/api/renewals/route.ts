import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEMO_EMAIL = "demo@agentcommissiontracker.com";

function formatError(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 90);

  const fromDate = startDate.toISOString().slice(0, 10);
  const toDate = endDate.toISOString().slice(0, 10);

  // Some Supabase tables use a column named "X-DATE" (with a dash) while others
  // expose expiration_date directly. Filtering on a column name with a hyphen
  // can be problematic across different environments. To make this endpoint
  // more robust, fetch the user's policies and perform the date range filtering
  // in application code.
  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .eq("user_email", DEMO_EMAIL);

  if (error) {
    console.error("Renewals API error:", error);
    return NextResponse.json({ error: formatError(error) }, { status: 500 });
  }

  // Map policies and separate renewals from missing expiration dates
  const allPolicies = (data ?? []).map((r: any) => ({
    id: r._id || r.id,
    customer: r["Customer"] || r.customer || "—",
    policy_number: r["Policy Number"] || r.policy_number || "—",
    carrier: r["Carrier Name"] || r.carrier || "—",
    premium_sold: Number(r["Premium Sold"] || r.premium_sold || 0) || 0,
    expiration_date: r["X-DATE"] || r.expiration_date || null,
  }));

  // Filter renewals within 90 days
  const renewals = allPolicies.filter((r: any) => {
    if (!r.expiration_date) return false;
    const dateOnly = r.expiration_date.split("T")[0];
    return dateOnly >= fromDate && dateOnly <= toDate;
  });

  // Find policies without expiration dates
  const noExpirationPolicies = allPolicies.filter((r: any) => !r.expiration_date);

  return NextResponse.json({ 
    data: renewals,
    noExpirationPolicies: noExpirationPolicies
  });
}
