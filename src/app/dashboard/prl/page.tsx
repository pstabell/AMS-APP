"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getDistinctCarriers,
  getPoliciesForPRL,
  getPRLSummary,
} from "@/lib/policies";
import type { Policy, PRLSummary } from "@/lib/policies";
import {
  calculateCommission,
  formatCurrency,
  formatPercent,
  TRANSACTION_TYPES,
} from "@/lib/calculations";

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  return value.split("T")[0];
}

const PAGE_SIZE = 25;

export default function PRLPage() {
  const { user } = useAuth();

  // Data state
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [summary, setSummary] = useState<PRLSummary | null>(null);
  const [carriers, setCarriers] = useState<string[]>([]);
  const [count, setCount] = useState(0);

  // Filter state
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [carrier, setCarrier] = useState<string>("");
  const [transactionType, setTransactionType] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);

  // Loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load carriers on mount
  useEffect(() => {
    const loadCarriers = async () => {
      if (!user?.email) return;
      const result = await getDistinctCarriers(user.email);
      if (!result.error) {
        setCarriers(result.data);
      }
    };
    loadCarriers();
  }, [user?.email]);

  // Load policies and summary when filters change
  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) return;
      
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const filters = {
          userEmail: user.email,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          carrier: carrier || null,
          transactionType: transactionType || null,
          search: search || null,
        };

        const [policiesResult, summaryResult] = await Promise.all([
          getPoliciesForPRL({ ...filters, page, pageSize: PAGE_SIZE }),
          getPRLSummary(filters),
        ]);

        if (policiesResult.error) {
          setError(`Unable to load policies: ${policiesResult.error}`);
          setPolicies([]);
          setCount(0);
        } else {
          setPolicies(policiesResult.data || []);
          setCount(policiesResult.count || 0);
        }

        if (summaryResult.error) {
          console.warn("Summary loading failed:", summaryResult.error);
          // Don't block the page for summary errors, just log it
        } else if (summaryResult.data) {
          setSummary(summaryResult.data);
        }

      } catch (err) {
        setError("Unexpected error loading data. Please refresh and try again.");
        console.error("PRL data loading error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.email, dateFrom, dateTo, carrier, transactionType, search, page]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / PAGE_SIZE)),
    [count]
  );

  // Calculate commission values for each policy
  const policiesWithCalcs = useMemo(() => {
    return policies.map((policy) => {
      const calc = calculateCommission({
        premiumSold: Number(policy.premium_sold) || 0,
        policyGrossCommPct: Number(policy.policy_gross_comm_pct) || 0,
        transactionType: policy.transaction_type,
        policyOriginationDate: policy.policy_origination_date,
        effectiveDate: policy.effective_date,
        agentPaidAmount: Number(policy.agent_paid_amount) || 0,
      });
      return { ...policy, calc };
    });
  }, [policies]);

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setCarrier("");
    setTransactionType("");
    setSearch("");
    setPage(1);
  };

  // Export functionality
  const handleExportCSV = () => {
    if (policiesWithCalcs.length === 0) {
      setError("No data to export. Apply filters to load data first.");
      return;
    }

    try {
      const headers = [
        "Customer", "Policy #", "Carrier", "Type", "Premium", "Gross %", 
        "Agency Comm", "Agent Rate", "Agent Comm", "Paid", "Balance", "Effective Date"
      ];
      
      const rows = policiesWithCalcs.map(policy => [
        policy.customer,
        policy.policy_number,
        policy.carrier,
        policy.transaction_type,
        Number(policy.premium_sold) || 0,
        Number(policy.policy_gross_comm_pct) || 0,
        policy.calc.agencyCommission,
        policy.calc.agentRate,
        policy.calc.agentCommission,
        Number(policy.agent_paid_amount) || 0,
        policy.calc.balanceDue,
        formatDate(policy.effective_date)
      ]);

      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `policy-revenue-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      setSuccess(`Successfully exported ${policiesWithCalcs.length} policies to CSV`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to export data. Please try again.");
      console.error("Export error:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] shadow-lg">
            <span className="text-3xl">📒</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-1">Policy Revenue Ledger</h2>
            <p className="text-[var(--foreground-muted)] flex items-center gap-2">
              <span className="text-lg">💰</span>
              Commission breakdown by transaction with agent rates applied
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={loading || policiesWithCalcs.length === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            title={policiesWithCalcs.length === 0 ? "No data to export" : "Export to CSV"}
          >
            <span className="text-lg">📥</span>
            Export CSV
          </button>
          <Link
            href="/dashboard/policies/new"
            className="btn-primary flex items-center gap-2"
          >
            <span className="text-lg">➕</span>
            Add New Policy
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
          <div className="card group cursor-pointer hover:scale-105">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] shadow-md">
                <span className="text-2xl">📄</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-primary)] mb-1">
                  Policies
                </p>
                <p className="text-2xl font-bold text-[var(--foreground)] group-hover:text-[var(--accent-primary)] transition-colors">
                  {summary.totalPolicies.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-hover)] rounded-full transition-all duration-1000 ease-out" style={{ width: '100%' }}></div>
            </div>
          </div>
          <div className="card group cursor-pointer hover:scale-105">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-secondary-hover)] shadow-md">
                <span className="text-2xl">💰</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-primary)] mb-1">
                  Premium
                </p>
                <p className="text-2xl font-bold text-[var(--foreground)] group-hover:text-[var(--accent-primary)] transition-colors">
                  {formatCurrency(summary.totalPremium)}
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--accent-secondary)] to-[var(--accent-secondary-hover)] rounded-full transition-all duration-1000 ease-out" style={{ width: '100%' }}></div>
            </div>
          </div>
          <div className="card group cursor-pointer hover:scale-105">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--highlight-amber)] to-orange-500 shadow-md">
                <span className="text-2xl">🏢</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-primary)] mb-1">
                  Agency Comm
                </p>
                <p className="text-2xl font-bold text-[var(--foreground)] group-hover:text-[var(--accent-primary)] transition-colors">
                  {formatCurrency(summary.totalAgencyComm)}
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--highlight-amber)] to-orange-500 rounded-full transition-all duration-1000 ease-out" style={{ width: '100%' }}></div>
            </div>
          </div>
          <div className="card group cursor-pointer hover:scale-105">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--highlight-amber)] shadow-md">
                <span className="text-2xl">👤</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-primary)] mb-1">
                  Agent Comm
                </p>
                <p className="text-2xl font-bold text-[var(--foreground)] group-hover:text-[var(--accent-primary)] transition-colors">
                  {formatCurrency(summary.totalAgentComm)}
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--highlight-amber)] rounded-full transition-all duration-1000 ease-out" style={{ width: '100%' }}></div>
            </div>
          </div>
          <div className="card group cursor-pointer hover:scale-105">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--success-green)] to-green-600 shadow-md">
                <span className="text-2xl">✅</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-primary)] mb-1">
                  Paid
                </p>
                <p className="text-2xl font-bold text-[var(--success-green)] group-hover:text-green-600 transition-colors">
                  {formatCurrency(summary.totalPaid)}
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--success-green)] to-green-600 rounded-full transition-all duration-1000 ease-out" style={{ width: '100%' }}></div>
            </div>
          </div>
          <div className="card group cursor-pointer hover:scale-105">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl shadow-md ${
                summary.totalBalance > 0 
                  ? 'bg-gradient-to-br from-[var(--highlight-amber)] to-orange-500'
                  : 'bg-gradient-to-br from-[var(--success-green)] to-green-600'
              }`}>
                <span className="text-2xl">{summary.totalBalance > 0 ? '⏳' : '✅'}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-primary)] mb-1">
                  Balance Due
                </p>
                <p className={`text-2xl font-bold group-hover:opacity-80 transition-colors ${
                  summary.totalBalance > 0 ? "text-[var(--highlight-amber)]" : "text-[var(--success-green)]"
                }`}>
                  {formatCurrency(summary.totalBalance)}
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ease-out ${
                summary.totalBalance > 0 
                  ? 'bg-gradient-to-r from-[var(--highlight-amber)] to-orange-500'
                  : 'bg-gradient-to-r from-[var(--success-green)] to-green-600'
              }`} style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">From</label>
            <input
              type="date"
              className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => {
                const newDate = e.target.value;
                setDateFrom(newDate);
                setPage(1);
                // Clear any validation errors when user changes date
                if (error && error.includes("date")) {
                  setError(null);
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">To</label>
            <input
              type="date"
              className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => {
                const newDate = e.target.value;
                setDateTo(newDate);
                setPage(1);
                // Clear any validation errors when user changes date
                if (error && error.includes("date")) {
                  setError(null);
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Carrier</label>
            <select
              className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
              value={carrier}
              onChange={(e) => {
                setCarrier(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Carriers</option>
              {carriers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Transaction
            </label>
            <select
              className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
              value={transactionType}
              onChange={(e) => {
                setTransactionType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Types</option>
              {TRANSACTION_TYPES.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.code}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-slate-600">Search</label>
            <input
              type="text"
              placeholder="Customer or policy #"
              className="w-full min-w-[160px] rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="font-medium text-rose-800 mb-1">Error Loading Data</p>
              <p className="text-sm text-rose-700 mb-3">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-sm bg-rose-100 hover:bg-rose-200 text-rose-800 px-3 py-1 rounded-lg transition-colors"
              >
                🔄 Retry
              </button>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-600 text-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xl">✅</span>
            <p className="flex-1 text-sm text-emerald-700">{success}</p>
            <button 
              onClick={() => setSuccess(null)}
              className="text-emerald-400 hover:text-emerald-600 text-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto min-h-[400px]">
          {/* Mobile-friendly hint */}
          <div className="md:hidden text-xs text-slate-500 p-3 border-b border-slate-100 bg-slate-50">
            💡 Tip: Swipe left/right to view all columns
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Policy #</th>
                <th className="px-3 py-3">Carrier</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3 text-right">Premium</th>
                <th className="px-3 py-3 text-right">Gross %</th>
                <th className="px-3 py-3 text-right">Agency Comm</th>
                <th className="px-3 py-3 text-right">Rate</th>
                <th className="px-3 py-3 text-right">Agent Comm</th>
                <th className="px-3 py-3 text-right">Paid</th>
                <th className="px-3 py-3 text-right">Balance</th>
                <th className="px-3 py-3">Effective</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 animate-pulse">
                    <td className="px-3 py-3"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="px-3 py-3"><div className="h-5 bg-slate-200 rounded-full w-12"></div></td>
                    <td className="px-3 py-3 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                    <td className="px-3 py-3 text-right"><div className="h-4 bg-slate-200 rounded w-10 ml-auto"></div></td>
                    <td className="px-3 py-3 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                    <td className="px-3 py-3 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto"></div></td>
                    <td className="px-3 py-3 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                    <td className="px-3 py-3 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                    <td className="px-3 py-3 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                    <td className="px-3 py-3"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  </tr>
                ))
              ) : policiesWithCalcs.length === 0 ? (
                <tr>
                  <td className="px-3 py-8 text-center" colSpan={12}>
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-4xl">📭</span>
                      <div>
                        <p className="font-medium text-slate-700 mb-1">No policies found</p>
                        <p className="text-sm text-slate-500 mb-4">
                          {dateFrom || dateTo || carrier || transactionType || search ? 
                            "No policies match your current filters. Try adjusting your search criteria." :
                            "Start by adding your first policy to track commissions and revenue."
                          }
                        </p>
                        <div className="flex items-center justify-center gap-3">
                          {(dateFrom || dateTo || carrier || transactionType || search) && (
                            <button
                              onClick={resetFilters}
                              className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors"
                            >
                              🔄 Clear Filters
                            </button>
                          )}
                          <Link
                            href="/dashboard/policies/new"
                            className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            ➕ Add First Policy
                          </Link>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                policiesWithCalcs.map((policy) => (
                  <tr
                    key={policy.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-3 py-3 font-medium text-slate-900">
                      <Link
                        href={`/dashboard/policies/${policy.id}`}
                        className="hover:text-slate-600"
                      >
                        {policy.customer}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {policy.policy_number}
                    </td>
                    <td className="px-3 py-3 text-slate-600">{policy.carrier}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          policy.transaction_type === "NEW" ||
                          policy.transaction_type === "NBS"
                            ? "bg-emerald-100 text-emerald-700"
                            : policy.transaction_type === "RWL"
                            ? "bg-blue-100 text-blue-700"
                            : policy.transaction_type === "CAN"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {policy.transaction_type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">
                      {formatCurrency(Number(policy.premium_sold) || 0)}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">
                      {Number(policy.policy_gross_comm_pct) || 0}%
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">
                      {formatCurrency(policy.calc.agencyCommission)}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">
                      {formatPercent(policy.calc.agentRate)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-slate-900">
                      {formatCurrency(policy.calc.agentCommission)}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-600">
                      {formatCurrency(Number(policy.agent_paid_amount) || 0)}
                    </td>
                    <td
                      className={`px-3 py-3 text-right font-medium ${
                        policy.calc.balanceDue > 0
                          ? "text-amber-600"
                          : "text-slate-600"
                      }`}
                    >
                      {formatCurrency(policy.calc.balanceDue)}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {formatDate(policy.effective_date)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} ({count} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <footer className="mt-12 border-t-2 border-[var(--border-color)] bg-gradient-to-r from-[var(--background-secondary)] to-[var(--background)] py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-2xl">🏢</span>
          <p className="font-bold text-[var(--accent-primary)]">Metro Point Technology</p>
        </div>
        <p className="text-xs text-[var(--foreground-muted)] mb-2">
          <a href="/terms" className="underline hover:text-[var(--accent-primary)] transition-colors">Terms of Service</a> |{' '}
          <a href="/privacy" className="underline hover:text-[var(--accent-primary)] transition-colors">Privacy Policy</a> |{' '}
          © 2026 All rights reserved
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm">®</span>
          <p className="text-xs text-[var(--foreground-subtle)]">Metro Point is a registered trademark</p>
        </div>
      </footer>
    </div>
  );
}
