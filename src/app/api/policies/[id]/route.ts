import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { id } = await params;

  try {
    const { data, error } = await supabase
      .from("policies")
      .select("*")
      .eq("_id", id)
      .single();

    if (error) {
      console.error("Policy detail API error:", error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    // Map all fields from the raw Supabase row
    const policy = {
      id: data._id,
      // Core fields
      customer: data["Customer"] || "—",
      policy_number: data["Policy Number"] || "—",
      carrier: data["Carrier Name"] || "—",
      mga: data["MGA Name"] || null,
      line_of_business: data["Policy Type"] || null,
      
      // Financial fields
      premium_sold: Number(data["Premium Sold"] || 0),
      policy_gross_comm_pct: Number(data["Policy Gross Comm %"] || 0),
      agency_estimated_comm: Number(data["Agent Estimated Comm $"] || 0),
      agent_comm_pct: Number(data["Agent Comm %"] || 0),
      broker_fee: Number(data["Broker Fee"] || 0),
      policy_taxes_fees: Number(data["Policy Taxes & Fees"] || 0),
      commissionable_premium: data["Commissionable Premium"],
      broker_fee_agent_comm: Number(data["Broker Fee Agent Comm"] || 0),
      total_agent_comm: Number(data["Total Agent Comm"] || 0),
      agent_paid_amount: data["Agent Paid Amount (STMT)"],
      agency_comm_received: data["Agency Comm Received (STMT)"],
      agency_estimated_revenue: data["Agency Estimated Comm/Revenue (CRM)"],
      
      // Transaction details
      transaction_type: data["Transaction Type"] || "NEW",
      transaction_id: data["Transaction ID"] || null,
      client_id: data["Client ID"] || null,
      
      // Dates
      effective_date: data["Effective Date"] || "",
      policy_origination_date: data["Policy Origination Date"] || null,
      expiration_date: data["X-DATE"] || null,
      statement_date: data["STMT DATE"] || null,
      
      // Policy details
      policy_term: data["Policy Term"] || null,
      prior_policy_number: data["Prior Policy Number"] || null,
      policy_checklist_complete: data["Policy Checklist Complete"] || null,
      as_earned_pmt_plan: data["AS_EARNED_PMT_PLAN"] || null,
      
      // Reconciliation
      reconciliation_status: data.reconciliation_status || "unreconciled",
      reconciliation_id: data.reconciliation_id || null,
      reconciled_at: data.reconciled_at || null,
      is_reconciliation_entry: data.is_reconciliation_entry || false,
      
      // References
      carrier_id: data.carrier_id || null,
      mga_id: data.mga_id || null,
      commission_rule_id: data.commission_rule_id || null,
      commission_rate_override: data.commission_rate_override || null,
      
      // Notes & metadata
      notes: data["NOTES"] || null,
      user_email: data.user_email || null,
      user_id: data.user_id || null,
      updated_at: data.updated_at || null,
    };

    return NextResponse.json({ data: policy });
  } catch (err: any) {
    console.error("Policy detail API error:", err);
    return NextResponse.json(
      { error: err.message || "Unable to load policy." },
      { status: 500 }
    );
  }
}
