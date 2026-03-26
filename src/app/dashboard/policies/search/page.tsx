"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Policy } from "@/lib/policies";

type SearchFilters = {
  search: string;
  carrier: string;
  mga: string;
  transactionType: string;
  dateFrom: string;
  dateTo: string;
};

type SortConfig = {
  field: keyof Policy;
  direction: "asc" | "desc";
};

export default function SearchFilterPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
    carrier: "",
    mga: "",
    transactionType: "",
    dateFrom: "",
    dateTo: "",
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "effective_date",
    direction: "desc",
  });

  const [carriers, setCarriers] = useState<string[]>([]);
  const [mgas, setMgas] = useState<string[]>([]);
  const [transactionTypes] = useState([
    "NEW", "RWL", "REWRITE", "ENDORSE", "CANCEL", "REINSTATE", "OTHER"
  ]);

  const buildHeaders = (): Record<string, string> => (user?.email ? { "x-user-email": user.email } : {});

  // Load distinct carriers and MGAs for filters
  useEffect(() => {
    const loadFilterOptions = async () => {
      if (!user?.email) return;
      
      try {
        const headers = buildHeaders();
        const [carriersRes, mgasRes] = await Promise.all([
          fetch("/api/policies/carriers", { headers }),
          fetch("/api/policies/mgas", { headers }),
        ]);

        if (carriersRes.ok) {
          const carriersData = await carriersRes.json();
          setCarriers(carriersData.data || []);
        }

        if (mgasRes.ok) {
          const mgasData = await mgasRes.json();
          setMgas(mgasData.data || []);
        }
      } catch (err) {
        console.error("Failed to load filter options:", err);
      }
    };

    loadFilterOptions();
  }, [user?.email]);

  const searchPolicies = useCallback(async () => {
    if (!user?.email) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        orderBy: sortConfig.field,
        orderDirection: sortConfig.direction,
      });

      // Add filters to params
      if (filters.search) params.set("search", filters.search);
      if (filters.carrier) params.set("carrier", filters.carrier);
      if (filters.mga) params.set("mga", filters.mga);
      if (filters.transactionType) params.set("transactionType", filters.transactionType);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);

      const headers = buildHeaders();
      const response = await fetch(`/api/policies/search?${params}`, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to search policies");
      }

      setPolicies(data.data || []);
      setTotalCount(data.count || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to search policies";
      setError(message);
      setPolicies([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.email, filters, sortConfig, currentPage]);

  useEffect(() => {
    searchPolicies();
  }, [searchPolicies]);

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSort = (field: keyof Policy) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      carrier: "",
      mga: "",
      transactionType: "",
      dateFrom: "",
      dateTo: "",
    });
    setCurrentPage(1);
  };

  const exportResults = () => {
    if (policies.length === 0) return;

    const headers = [
      "Customer", "Policy Number", "Carrier", "MGA", "Transaction Type",
      "Premium Sold", "Commission %", "Agency Comm", "Agent Comm",
      "Effective Date", "Expiration Date", "Line of Business"
    ];

    const csvData = policies.map(policy => [
      policy.customer,
      policy.policy_number,
      policy.carrier,
      policy.mga || "",
      policy.transaction_type,
      policy.premium_sold,
      policy.policy_gross_comm_pct,
      policy.agency_estimated_comm,
      policy.agent_estimated_comm || "",
      policy.effective_date,
      policy.expiration_date || "",
      policy.line_of_business || ""
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `policy-search-results-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] shadow-lg">
          <span className="text-3xl">🔍</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-1">Search & Filter Policies</h2>
          <p className="text-[var(--foreground-muted)] flex items-center gap-2">
            <span className="text-lg">🔎</span>
            Search and filter policies by customer, carrier, dates, and more
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border-2 border-[var(--error-red)] bg-gradient-to-br from-[var(--background)] to-[var(--background-secondary)] px-6 py-4 text-sm text-[var(--error-red)] shadow-lg flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold">Search Error</p>
            <p className="text-xs opacity-80">{error}</p>
            <button 
              type="button" 
              onClick={() => setError(null)} 
              className="ml-2 font-medium underline hover:text-[var(--foreground)]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Panel */}
      <div className="card">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-secondary-hover)] shadow-md">
            <span className="text-xl">🎯</span>
          </div>
          <h3 className="text-xl font-bold text-[var(--foreground)]">Search & Filter Options</h3>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <span className="text-lg">🔍</span>
              Search (Customer/Policy #)
            </label>
            <input
              type="text"
              className="w-full rounded-xl border-2 border-[var(--border-color)] bg-[var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-20 transition-all"
              placeholder="Enter customer name or policy number..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>

          {/* Carrier Filter */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <span className="text-lg">🏢</span>
              Carrier
            </label>
            <select
              className="w-full rounded-xl border-2 border-[var(--border-color)] bg-[var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-20 transition-all"
              value={filters.carrier}
              onChange={(e) => handleFilterChange("carrier", e.target.value)}
            >
              <option value="">All Carriers</option>
              {carriers.map(carrier => (
                <option key={carrier} value={carrier}>{carrier}</option>
              ))}
            </select>
          </div>

          {/* MGA Filter */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <span className="text-lg">🤝</span>
              MGA
            </label>
            <select
              className="w-full rounded-xl border-2 border-[var(--border-color)] bg-[var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-20 transition-all"
              value={filters.mga}
              onChange={(e) => handleFilterChange("mga", e.target.value)}
            >
              <option value="">All MGAs</option>
              {mgas.map(mga => (
                <option key={mga} value={mga}>{mga}</option>
              ))}
            </select>
          </div>

          {/* Transaction Type */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <span className="text-lg">📋</span>
              Transaction Type
            </label>
            <select
              className="w-full rounded-xl border-2 border-[var(--border-color)] bg-[var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-20 transition-all"
              value={filters.transactionType}
              onChange={(e) => handleFilterChange("transactionType", e.target.value)}
            >
              <option value="">All Types</option>
              {transactionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <span className="text-lg">📅</span>
              Date From
            </label>
            <input
              type="date"
              className="w-full rounded-xl border-2 border-[var(--border-color)] bg-[var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-20 transition-all"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            />
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <span className="text-lg">📅</span>
              Date To
            </label>
            <input
              type="date"
              className="w-full rounded-xl border-2 border-[var(--border-color)] bg-[var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-20 transition-all"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={searchPolicies}
            disabled={loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <span className="text-lg">{loading ? "⏳" : "🔍"}</span>
            {loading ? "Searching..." : "Search"}
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border-2 border-[var(--border-color)] bg-[var(--background)] px-4 py-3 text-sm font-bold text-[var(--foreground)] shadow-lg hover:bg-[var(--background-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-50 transition-all flex items-center gap-2"
          >
            <span className="text-lg">🧹</span>
            Clear Filters
          </button>
          {policies.length > 0 && (
            <button
              type="button"
              onClick={exportResults}
              className="rounded-xl border-2 border-[var(--success-green)] bg-[var(--success-green)] px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all flex items-center gap-2"
            >
              <span className="text-lg">📊</span>
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="card">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] shadow-md">
            <span className="text-xl">📊</span>
          </div>
          <div className="flex-1 flex items-center justify-between">
            <h3 className="text-xl font-bold text-[var(--foreground)]">
              Search Results ({totalCount} found)
            </h3>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl px-4 py-2 text-sm border-2 border-[var(--border-color)] bg-[var(--background)] disabled:opacity-50 hover:bg-[var(--background-secondary)] transition-all flex items-center gap-1"
                >
                  <span>⬅️</span> Previous
                </button>
                <span className="text-sm text-[var(--foreground-muted)] px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl px-4 py-2 text-sm border-2 border-[var(--border-color)] bg-[var(--background)] disabled:opacity-50 hover:bg-[var(--background-secondary)] transition-all flex items-center gap-1"
                >
                  Next <span>➡️</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-warm w-full text-sm">
            <thead>
              <tr>
                <th 
                  className="text-left cursor-pointer hover:bg-[var(--accent-primary-hover)] hover:bg-opacity-10 transition-colors"
                  onClick={() => handleSort("customer")}
                >
                  👤 Customer {sortConfig.field === "customer" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th 
                  className="text-left cursor-pointer hover:bg-[var(--accent-primary-hover)] hover:bg-opacity-10 transition-colors"
                  onClick={() => handleSort("policy_number")}
                >
                  📄 Policy # {sortConfig.field === "policy_number" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th 
                  className="text-left cursor-pointer hover:bg-[var(--accent-primary-hover)] hover:bg-opacity-10 transition-colors"
                  onClick={() => handleSort("carrier")}
                >
                  🏢 Carrier {sortConfig.field === "carrier" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-left">📋 Transaction</th>
                <th 
                  className="text-right cursor-pointer hover:bg-[var(--accent-primary-hover)] hover:bg-opacity-10 transition-colors"
                  onClick={() => handleSort("premium_sold")}
                >
                  💰 Premium {sortConfig.field === "premium_sold" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th 
                  className="text-left cursor-pointer hover:bg-[var(--accent-primary-hover)] hover:bg-opacity-10 transition-colors"
                  onClick={() => handleSort("effective_date")}
                >
                  📅 Effective Date {sortConfig.field === "effective_date" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-left">⚙️ Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="text-center text-[var(--foreground-muted)] py-8" colSpan={7}>
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-3xl animate-pulse">⏳</span>
                      <div>
                        <p className="font-semibold">Loading policies...</p>
                        <p className="text-xs">Please wait</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : policies.length === 0 ? (
                <tr>
                  <td className="text-center text-[var(--foreground-muted)] py-8" colSpan={7}>
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-3xl">🔍</span>
                      <div>
                        <p className="font-semibold">No policies found</p>
                        <p className="text-xs">No policies match your search criteria</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                policies.map((policy) => (
                  <tr key={policy.id} className="group">
                    <td className="font-semibold text-[var(--foreground)]">
                      {policy.customer}
                    </td>
                    <td className="text-[var(--foreground-muted)]">
                      {policy.policy_number}
                    </td>
                    <td className="text-[var(--foreground-muted)]">
                      {policy.carrier}
                    </td>
                    <td>
                      <span className="rounded-full bg-gradient-to-r from-[var(--accent-secondary)] to-[var(--accent-secondary-hover)] px-3 py-1 text-xs font-medium text-white shadow-sm">
                        {policy.transaction_type}
                      </span>
                    </td>
                    <td className="text-right text-[var(--accent-primary)] font-semibold">
                      {formatCurrency(policy.premium_sold)}
                    </td>
                    <td className="text-[var(--foreground-muted)]">
                      {formatDate(policy.effective_date)}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => window.open(`/dashboard/policies/${policy.id}`, "_blank")}
                          className="text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] font-medium text-xs underline transition-colors"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(`/dashboard/policies/${policy.id}/edit`, "_blank")}
                          className="text-[var(--accent-secondary)] hover:text-[var(--accent-secondary-hover)] font-medium text-xs underline transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
