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

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const carrier = searchParams.get("carrier") ?? "";
  const mga = searchParams.get("mga") ?? "";
  const transactionType = searchParams.get("transactionType") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  function parseNumber(value: string | null, fallback: number) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
    return fallback;
  }

  const page = parseNumber(searchParams.get("page"), 1);
  const pageSize = parseNumber(searchParams.get("pageSize"), 25);
  const orderByParam = searchParams.get("orderBy") ?? "effective_date";
  const orderDirection = (searchParams.get("orderDirection") ?? "desc") as "asc" | "desc";

  // Map snake_case to actual column names
  const columnMap: Record<string, string> = {
    effective_date: "Effective Date",
    customer: "Customer",
    policy_number: "Policy Number",
    carrier: "Carrier Name",
    premium_sold: "Premium Sold",
    transaction_type: "Transaction Type",
  };
  const orderBy = columnMap[orderByParam] || "Effective Date";

  const userEmail = request.headers.get("x-user-email") || DEMO_EMAIL;

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("policies")
      .select("*", { count: "exact" })
      .eq("user_email", userEmail);

    // Apply search filter
    if (search.trim()) {
      query = query.or(
        `Customer.ilike.%${search.trim()}%,Policy Number.ilike.%${search.trim()}%`
      );
    }

    // Apply carrier filter: if numeric ID passed, filter by carrier id column; otherwise match Carrier Name
    if (carrier) {
      if (/^\d+$/.test(carrier)) {
        query = query.eq("carrier", Number(carrier));
      } else {
        query = query.eq("Carrier Name", carrier);
      }
    }

    // Apply MGA filter: support numeric ID or name
    if (mga) {
      if (/^\d+$/.test(mga)) {
        query = query.eq("mga", Number(mga));
      } else {
        query = query.eq("MGA Name", mga);
      }
    }

    // Apply transaction type filter
    if (transactionType) {
      query = query.eq("Transaction Type", transactionType);
    }

    // Apply date range filters
    if (dateFrom) {
      query = query.gte("Effective Date", dateFrom);
    }
    if (dateTo) {
      query = query.lte("Effective Date", dateTo);
    }

    // Apply ordering and pagination
    query = query
      .order(orderBy, { ascending: orderDirection === "asc" })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Search API error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map data to expected format
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
      user_email: r.user_email || userEmail,
      reconciliation_status: r.reconciliation_status || "unreconciled",
    }));

    return NextResponse.json({ data: policies, count: count ?? 0 });
  } catch (err: any) {
    console.error("Search API error:", err);
    return NextResponse.json({ error: err.message || "Unable to search policies." }, { status: 500 });
  }
}
