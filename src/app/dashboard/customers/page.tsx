"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { Customer } from "@/lib/customers";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return value.split("T")[0];
}

const PAGE_SIZE = 25;

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomers = async () => {
      if (!user?.email) return;
      
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          search,
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });

        const response = await fetch(`/api/customers?${params.toString()}`, {
          headers: {
            "x-user-email": user.email,
          },
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load customers.");
        }

        setCustomers(payload.data ?? []);
        setCount(payload.count ?? 0);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load customers.";
        setError(message);
        setCustomers([]);
        setCount(0);
      }
      setLoading(false);
    };

    loadCustomers();
  }, [user?.email, search, page]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / PAGE_SIZE)),
    [count]
  );

  const showingRecords = useMemo(() => {
    if (count === 0) return "Showing 0 customers";
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, count);
    return `Showing ${start} to ${end} of ${count} customers`;
  }, [page, count]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard", icon: "🏠" },
    { label: "Customers", icon: "👥" },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
          <span className="text-3xl">👥</span>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--foreground)]">Customers</h1>
          <p className="text-[var(--foreground-muted)] flex items-center gap-2 mt-1">
            <span className="text-blue-500">●</span>
            Drill down to view policies and transactions
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-4 rounded-xl shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <span className="font-bold text-lg">
                Total Customers: <span className="text-blue-400">{count}</span>
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3">
            <span className="text-blue-400 font-semibold">🔍 Search</span>
            <input
              type="text"
              placeholder="Search by customer name..."
              className="w-64 rounded-lg border-0 px-4 py-2 text-sm text-slate-900 bg-white shadow-inner outline-none focus:ring-2 focus:ring-blue-400"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Navigation Hint */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-blue-600 font-semibold">💡 Tip:</span>
          <span className="text-slate-700">
            Click on a customer to view their policies. Then drill into each policy to see all transactions (liabilities/credits).
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          ❌ {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-200 border-b-2 border-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-slate-700">👤 Customer Name</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-slate-700 text-center">📄 Policies</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-slate-700 text-center">📋 Trans</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-slate-700">🏢 Carriers</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-slate-700 text-right">💰 Total Premium</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-slate-700 text-right">💎 Agent Comm</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-slate-700">📅 Latest Activity</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                    <div className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Loading customers...
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">👥</span>
                      <span>No customers found. Add policies to see customers here.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="font-bold text-slate-900 hover:text-blue-700 transition-colors flex items-center gap-2"
                      >
                        <span className="text-lg">👤</span>
                        {customer.name}
                        <span className="text-blue-500 text-xs">→</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold">
                        {customer.policyCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-slate-600 font-medium">
                        {customer.transactionCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {customer.carriers.slice(0, 3).map((carrier) => (
                          <span
                            key={carrier}
                            className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                          >
                            {carrier}
                          </span>
                        ))}
                        {customer.carriers.length > 3 && (
                          <span className="inline-block rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                            +{customer.carriers.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-emerald-600">
                        {formatCurrency(customer.totalPremium)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-amber-600">
                        {formatCurrency(customer.totalAgentComm)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">
                        {formatDate(customer.latestEffectiveDate)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-100 rounded-xl p-4">
        <p className="text-sm text-slate-600 font-semibold">
          {showingRecords} • Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            ← Previous
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
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
