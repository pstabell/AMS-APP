"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Policy } from "@/lib/policies";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return "";
  return value.split("T")[0];
}

function downloadCSV(data: Policy[], filename: string) {
  const headers = ['Customer', 'Policy Number', 'Carrier', 'Premium', 'Commission', 'Effective Date'];
  const csvContent = [
    headers.join(','),
    ...data.map(policy => [
      `"${policy.customer || ''}"`,
      `"${policy.policy_number || ''}"`,
      `"${policy.carrier || ''}"`,
      `"${Number(policy.premium_sold) || 0}"`,
      `"${Number(policy.agency_estimated_comm) || 0}"`,
      `"${formatDate(policy.effective_date)}"`,
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

// Column mapping for sorting (display name -> Supabase column name)
const SORT_COLUMNS: Record<string, string> = {
  customer: "Customer",
  policy_number: "Policy Number",
  carrier: "Carrier Name",
  premium: "Premium Sold",
  commission: "Agent Estimated Comm $",
  effective: "Effective Date",
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>("effective");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Handle column header click for sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New column, default to descending
      setSortColumn(column);
      setSortDirection("desc");
    }
    setPage(1); // Reset to first page when sorting
  };

  // Get sort indicator for column header
  const getSortIndicator = (column: string) => {
    if (sortColumn !== column) return <span className="text-[var(--foreground-subtle)] opacity-50">⇅</span>;
    return <span className="text-[var(--accent-primary)]">{sortDirection === "asc" ? "↑" : "↓"}</span>;
  };

  useEffect(() => {
    const loadPolicies = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          search,
          page: String(page),
          pageSize: String(pageSize),
          orderBy: SORT_COLUMNS[sortColumn] || "Effective Date",
          orderDirection: sortDirection,
        });

        const response = await fetch(`/api/policies?${params.toString()}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load policies.");
        }

        setPolicies(payload.data ?? []);
        setCount(payload.count ?? 0);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to load policies.";
        setError(message);
        setPolicies([]);
        setCount(0);
      }
      setLoading(false);
    };

    loadPolicies();
  }, [search, page, pageSize, sortColumn, sortDirection]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / pageSize)),
    [count, pageSize]
  );

  const showingRecords = useMemo(() => {
    if (count === 0) return "Showing 0 records";
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, count);
    return `Showing ${start}-${end} of ${count}`;
  }, [page, pageSize, count]);

  const uniquePoliciesCount = useMemo(() => {
    const uniqueNumbers = new Set(policies.map(p => p.policy_number));
    return uniqueNumbers.size;
  }, [policies]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(event.target.value));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="p-3 rounded-xl gradient-accent shadow-lg glow-accent">
          <span className="text-2xl">📋</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">All Policy Transactions</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
            Complete transaction history and management
          </p>
        </div>
        <Link href="/dashboard/policies/new" className="btn-primary inline-flex items-center gap-2">
          <span>+</span>
          Add New Policy
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="bg-[var(--background-tertiary)] border border-[var(--border-color)] px-5 py-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <span className="text-sm font-medium text-[var(--foreground-muted)]">Transactions:</span>
            <span className="font-bold text-[var(--gold-primary)]">{count}</span>
          </div>
          <div className="h-5 w-px bg-[var(--border-color-strong)]" />
          <div className="flex items-center gap-2">
            <span className="text-xl">📁</span>
            <span className="text-sm font-medium text-[var(--foreground-muted)]">Unique Policies:</span>
            <span className="font-bold text-[var(--success)]">{uniquePoliciesCount}</span>
          </div>
        </div>
        
        {/* Quick Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-[var(--foreground-subtle)]">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Search customer or policy #"
            className="w-64 pl-9 pr-3 py-2 text-sm rounded-lg"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
          />
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--background-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--foreground-muted)]">Per page:</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="rounded-lg px-2 py-1.5 text-sm"
            >
              {[25, 50, 100, 200].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          
          <div className="h-5 w-px bg-[var(--border-color)]" />
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="w-7 h-7 rounded-lg border border-[var(--border-color)] bg-[var(--background-tertiary)] text-[var(--foreground-muted)] text-sm disabled:opacity-40 hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)] transition"
            >
              ‹
            </button>
            <span className="px-3 py-1 bg-[var(--background-tertiary)] border border-[var(--border-color)] rounded-lg text-sm font-medium text-[var(--foreground)] min-w-[3rem] text-center">
              {page}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 rounded-lg border border-[var(--border-color)] bg-[var(--background-tertiary)] text-[var(--foreground-muted)] text-sm disabled:opacity-40 hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)] transition"
            >
              ›
            </button>
            <span className="text-xs text-[var(--foreground-subtle)]">of {totalPages}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--foreground-muted)]">{showingRecords}</span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--success)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition"
            onClick={() => downloadCSV(policies, `policies-page-${page}.csv`)}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-[var(--info-muted)] border border-[var(--info)]/30 rounded-lg px-4 py-2.5">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-medium text-[var(--info)]">Row Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[var(--info-muted)] border border-[var(--info)]/30" />
            <span className="text-[var(--foreground-muted)]">Reconciled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[var(--background-secondary)] border border-[var(--border-color)]" />
            <span className="text-[var(--foreground-muted)]">Pending</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--error)] bg-[var(--error-muted)] px-4 py-3 text-sm text-[var(--error)] flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--background-secondary)] rounded-xl border border-[var(--border-color)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="bg-[var(--background-tertiary)] border-b border-[var(--border-color-strong)]">
                <th 
                  className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors select-none"
                  onClick={() => handleSort("customer")}
                >
                  <div className="flex items-center gap-2">👤 Customer {getSortIndicator("customer")}</div>
                </th>
                <th 
                  className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors select-none"
                  onClick={() => handleSort("policy_number")}
                >
                  <div className="flex items-center gap-2">📄 Policy # {getSortIndicator("policy_number")}</div>
                </th>
                <th 
                  className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors select-none"
                  onClick={() => handleSort("carrier")}
                >
                  <div className="flex items-center gap-2">🏢 Carrier {getSortIndicator("carrier")}</div>
                </th>
                <th 
                  className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors select-none"
                  onClick={() => handleSort("premium")}
                >
                  <div className="flex items-center gap-2">💰 Premium {getSortIndicator("premium")}</div>
                </th>
                <th 
                  className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors select-none"
                  onClick={() => handleSort("commission")}
                >
                  <div className="flex items-center gap-2">💎 Commission {getSortIndicator("commission")}</div>
                </th>
                <th 
                  className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors select-none"
                  onClick={() => handleSort("effective")}
                >
                  <div className="flex items-center gap-2">📅 Effective {getSortIndicator("effective")}</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <tr>
                  <td className="px-4 py-12 text-center text-[var(--foreground-muted)]" colSpan={6}>
                    <div className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Loading policies...
                    </div>
                  </td>
                </tr>
              ) : policies.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center" colSpan={6}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-[var(--background-tertiary)] flex items-center justify-center">
                        <span className="text-3xl opacity-60">📋</span>
                      </div>
                      <div>
                        <p className="font-medium text-[var(--foreground)]">No policies found</p>
                        <p className="text-sm text-[var(--foreground-muted)]">Try adjusting your search or add a new policy</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                policies.map((policy) => {
                  const isReconciled = policy.reconciliation_status === 'reconciled' || policy.is_reconciled === true;
                  return (
                    <tr 
                      key={policy.id} 
                      className={`transition-colors ${
                        isReconciled 
                          ? 'bg-[var(--info-muted)] hover:bg-[rgba(59,130,246,0.25)]' 
                          : 'hover:bg-[var(--hover-bg)]'
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/dashboard/policies/${policy.id}`}
                          className="font-medium text-[var(--foreground)] hover:text-[var(--accent-primary)] transition-colors"
                        >
                          {policy.customer}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-sm text-[var(--foreground-muted)]">
                          {policy.policy_number}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[var(--foreground)]">
                          {policy.carrier}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-[var(--success)]">
                          {formatCurrency(Number(policy.premium_sold) || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-[var(--gold-primary)]">
                          {formatCurrency(Number(policy.agency_estimated_comm) || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-[var(--foreground-muted)]">
                          {formatDate(policy.effective_date)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--background-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-3">
        <p className="text-sm text-[var(--foreground-muted)]">
          {showingRecords} • Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary px-3 py-1.5 text-sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            ← Previous
          </button>
          <button
            type="button"
            className="btn-secondary px-3 py-1.5 text-sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
