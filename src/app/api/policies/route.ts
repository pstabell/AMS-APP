import { NextRequest, NextResponse } from "next/server";
import { createPolicy } from "@/lib/policies";
import { createClient } from "@supabase/supabase-js";

const DEMO_EMAIL = "demo@agentcommissiontracker.com";
const allowedTransactionTypes = new Set(["NEW", "NBS", "RWL", "END", "PCH", "CAN", "XCL", "STL", "BoR", "REWRITE"]);

function parseNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

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

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const page = parseNumber(searchParams.get("page"), 1);
  const pageSize = parseNumber(searchParams.get("pageSize"), 50);
  // Use actual column names from Supabase (spaced/titled columns)
  const orderBy = searchParams.get("orderBy") ?? "Effective Date";
  const orderDirection = (searchParams.get("orderDirection") ?? "desc") as "asc" | "desc";

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("policies")
      .select("*", { count: "exact" })
      .order(orderBy, { ascending: orderDirection === "asc" })
      .range(from, to);

    if (search.trim()) {
      // Use actual Supabase column names
      query = query.or(
        `Customer.ilike.%${search.trim()}%,Policy Number.ilike.%${search.trim()}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Policies API error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map data to expected format (actual Supabase column names)
    const policies = (data ?? []).map((r: any) => ({
      id: r._id || r.id,
      customer: r["Customer"] || r.customer || "—",
      policy_number: r["Policy Number"] || r.policy_number || "—",
      carrier: r["Carrier Name"] || r.carrier || "—",
      mga: r["MGA Name"] || r.mga || null,
      line_of_business: r["Policy Type"] || r.line_of_business || null,
      premium_sold: Number(r["Premium Sold"] || r.premium_sold || 0),
      policy_gross_comm_pct: Number(r["Policy Gross Comm %"] || r.policy_gross_comm_pct || 0),
      agency_estimated_comm: Number(r["Agent Estimated Comm $"] || r.agency_estimated_comm || 0),
      agent_estimated_comm: Number(r["Agent Estimated Comm $"] || r.agent_estimated_comm || 0),
      agent_paid_amount: Number(r["Agent Paid Amount (STMT)"] || r.agent_paid_amount || 0),
      transaction_type: r["Transaction Type"] || r.transaction_type || "NEW",
      effective_date: r["Effective Date"] || r.effective_date || "",
      policy_origination_date: r["Policy Origination Date"] || r.policy_origination_date || null,
      expiration_date: r["X-DATE"] || r.expiration_date || null,
      statement_date: r["STMT DATE"] || r.statement_date || null,
      invoice_number: r["Invoice Number"] || r.invoice_number || null,
      notes: r["NOTES"] || r.notes || null,
      user_email: r.user_email || DEMO_EMAIL,
      user_id: r.user_id || "",
      created_at: r.created_at || null,
      updated_at: r.updated_at || null,
      reconciliation_status: r.reconciliation_status || null,
      is_reconciled: r.reconciliation_status === "reconciled" || false,
    }));

    return NextResponse.json({ data: policies, count: count ?? 0 });
  } catch (err: any) {
    console.error("Policies API error:", err);
    return NextResponse.json({ error: err.message || "Unable to load policies." }, { status: 500 });
  }
}

async function resolveUser(body: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { userId: null, email: null, error: "Supabase not configured." };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const email = String(body?.user_email || DEMO_EMAIL).trim().toLowerCase();
  let userId = body?.user_id ? String(body.user_id) : "";

  if (!userId) {
    const { data, error } = await supabase
      .from("users")
      .select("id, email")
      .ilike("email", email)
      .maybeSingle();

    if (error || !data?.id) {
      return { userId: null, email: null, error: "Unable to identify user." };
    }

    userId = data.id;
    return { userId, email: data.email, error: null };
  }

  return { userId, email, error: null };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customer = String(body?.customer ?? "").trim();
    const policyNumber = String(body?.policy_number ?? "").trim();
    const carrier = String(body?.carrier ?? "").trim();

    if (!customer || !policyNumber || !carrier) {
      return NextResponse.json(
        { error: "Customer, policy number, and carrier are required." },
        { status: 400 }
      );
    }

    const premiumSold = Number(body?.premium_sold ?? 0);
    const commissionPct = Number(body?.policy_gross_comm_pct ?? 0);

    if (!Number.isFinite(premiumSold) || premiumSold < 0) {
      return NextResponse.json(
        { error: "Premium sold must be a valid number." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(commissionPct) || commissionPct < 0) {
      return NextResponse.json(
        { error: "Commission percent must be a valid number." },
        { status: 400 }
      );
    }

    const transactionType = String(body?.transaction_type || "NEW").trim();
    if (!allowedTransactionTypes.has(transactionType)) {
      return NextResponse.json(
        { error: "Invalid transaction type." },
        { status: 400 }
      );
    }

    const effectiveDate = String(body?.effective_date || "").trim();
    const resolvedEffectiveDate =
      effectiveDate || new Date().toISOString().slice(0, 10);

    const { userId, email, error } = await resolveUser(body);
    if (error || !userId || !email) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    const agencyEstimatedComm = (premiumSold * commissionPct) / 100;

    const result = await createPolicy({
      customer,
      policy_number: policyNumber,
      carrier,
      premium_sold: premiumSold,
      policy_gross_comm_pct: commissionPct,
      agency_estimated_comm: agencyEstimatedComm,
      transaction_type: transactionType,
      effective_date: resolvedEffectiveDate,
      notes: body?.notes ? String(body.notes) : null,
      user_email: email,
      user_id: userId,
      agent_estimated_comm: 0,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
