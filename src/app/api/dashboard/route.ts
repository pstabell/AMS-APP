import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getStartOfYearISO() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  return start.toISOString().slice(0, 10);
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

  // Floor-based data scoping
  const { searchParams } = new URL(request.url);
  const floor = parseInt(searchParams.get("floor") || "1") as 1 | 2;
  const userId = searchParams.get("userId"); // UUID from users table

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const startOfYear = getStartOfYearISO();

  try {
    // Floor 1 (Agent): filter by user_id → agent sees only their policies
    // Floor 2 (Agency): no filter → admin sees all policies
    let query = supabase.from("policies").select("*", { count: "exact" });
    if (floor === 1 && userId) {
      query = query.eq("user_id", userId);
    }
    const { data: allData, error: allError, count: totalCount } = await query;

    if (allError) {
      console.error("Dashboard allData error:", allError);
      return NextResponse.json(
        { error: "Unable to load dashboard metrics.", detail: allError.message },
        { status: 500 }
      );
    }

    const allRaw = allData ?? [];

    // CRITICAL: Deduplicate by Transaction ID (matches original Commission Tracker behavior)
    const seenTxIds = new Set<string>();
    const all = allRaw.filter((r: any) => {
      const txId = r["Transaction ID"];
      if (!txId || seenTxIds.has(txId)) return false;
      seenTxIds.add(txId);
      return true;
    });

    // Separate real policy transactions from reconciliation entries
    const policyTransactions = all.filter((r: any) => !r["is_reconciliation_entry"]);
    const reconciliationEntries = all.filter((r: any) => r["is_reconciliation_entry"]);

    // Calculate metrics matching original Commission Tracker
    // Total Transactions = ALL deduped rows (original uses len(df) after dedup)
    const totalTransactions = all.length;
    const uniquePolicies = new Set(all.map((r: any) => r["Policy Number"]).filter(Boolean)).size;
    
    // This month (all deduped rows)
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
    const thisMonth = all.filter((r: any) => r["Effective Date"] && r["Effective Date"] >= monthStart);
    
    // STMT transactions (Transaction Type starts with -)
    const stmtTransactions = all.filter((r: any) => {
      const tt = (r["Transaction Type"] || "");
      return tt.startsWith("-");
    });

    // Active & Cancelled: Get LATEST transaction per Policy Number, then check type
    // (matches original: df.sort_values('Effective Date').groupby('Policy Number').last())
    const policyMap = new Map<string, any>();
    const sortedAll = [...all].sort((a: any, b: any) => 
      (a["Effective Date"] || "").localeCompare(b["Effective Date"] || "")
    );
    for (const r of sortedAll) {
      const pn = (r["Policy Number"] || "").toString().trim();
      if (pn) policyMap.set(pn, r); // last one wins (sorted by date)
    }
    const latestPerPolicy = Array.from(policyMap.values());
    
    const active = latestPerPolicy.filter((r: any) => {
      const tt = (r["Transaction Type"] || "").toUpperCase();
      return tt !== "CAN" && tt !== "XCL";
    });

    const cancelled = latestPerPolicy.filter((r: any) => {
      const tt = (r["Transaction Type"] || "").toUpperCase();
      return tt === "CAN" || tt === "XCL";
    });

    // Reconciliation count
    const reconciledCount = reconciliationEntries.length;

    // Commission totals — exclude reconciliation entries from premium (matches original)
    const originalTransactions = all.filter((r: any) => {
      const txId = (r["Transaction ID"] || "").toString();
      return !txId.includes("-STMT-") && !txId.includes("-VOID-") && !txId.includes("-ADJ-");
    });
    const totalCommDue = all.reduce((sum: number, r: any) => sum + (Number(r["Agent Estimated Comm $"]) || 0), 0);
    const totalCommEarned = active.reduce((sum: number, r: any) => sum + (Number(r["Total Agent Comm"]) || 0), 0);

    // YTD data (policy transactions only)
    const ytdData = policyTransactions.filter((r: any) => r["Effective Date"] && r["Effective Date"] >= startOfYear);
    const ytdPremium = ytdData.reduce((sum: number, r: any) => sum + (Number(r["Premium Sold"]) || 0), 0);
    const ytdCommission = ytdData.reduce((sum: number, r: any) => sum + (Number(r["Agent Estimated Comm $"]) || 0), 0);

    // Recent 10 policies (policy transactions only, not reconciliation)
    const recent = [...policyTransactions]
      .filter((r: any) => r["Effective Date"])
      .sort((a: any, b: any) => (b["Effective Date"] || "").localeCompare(a["Effective Date"] || ""))
      .slice(0, 10)
      .map((r: any) => ({
        id: r._id,
        customer: r["Customer"] || "—",
        policyNumber: r["Policy Number"] || "—",
        carrier: r["Carrier Name"] || "—",
        premiumSold: Number(r["Premium Sold"]) || 0,
        commission: Number(r["Agent Estimated Comm $"]) || 0,
        effectiveDate: r["Effective Date"] || "—",
        isReconciled: r["reconciliation_status"] === "reconciled" || r["is_reconciled"] === true,
      }));

    return NextResponse.json({
      metrics: {
        totalTransactions,
        uniquePolicies,
        thisMonth: thisMonth.length,
        active: active.length,
        cancelled: cancelled.length,
        stmtTransactions: stmtTransactions.length,
        totalCommDue,
        totalCommEarned,
        reconciliationCount: reconciledCount,
      },
      ytd: {
        totalCommission: ytdCommission,
        totalPremium: ytdPremium,
        policyCount: ytdData.length,
        startDate: startOfYear,
      },
      recent,
    });
  } catch (err: any) {
    console.error("Dashboard API error:", err);
    return NextResponse.json(
      { error: "Unable to load dashboard metrics.", detail: err.message },
      { status: 500 }
    );
  }
}
