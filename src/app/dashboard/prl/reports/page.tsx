"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatPercent } from "@/lib/calculations";

type PRLReportSummary = {
  totalPolicies: number;
  totalPremium: number;
  totalAgencyComm: number;
  totalAgentComm: number;
  totalPaid: number;
  totalBalance: number;
  newBusinessCount: number;
  renewalCount: number;
};

type CarrierReport = {
  carrier: string;
  policyCount: number;
  totalPremium: number;
  totalAgencyComm: number;
  avgCommPct: number;
};

type MonthlyReport = {
  month: string;
  monthLabel: string;
  policyCount: number;
  totalPremium: number;
  totalAgencyComm: number;
};

export default function PolicyRevenueLedgerReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PRLReportSummary | null>(null);
  const [carrierBreakdown, setCarrierBreakdown] = useState<CarrierReport[]>([]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyReport[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);

        const response = await fetch(
          `/api/reports${params.toString() ? `?${params.toString()}` : ""}`,
          {
            headers: user?.email ? { "x-user-email": user.email } : {},
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load reports.");
        }

        const data = await response.json();
        setSummary(data.summary);
        setCarrierBreakdown(data.carrierBreakdown || []);
        setMonthlyBreakdown(data.monthlyBreakdown || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [user?.email, dateFrom, dateTo]);

  const handleExportCSV = () => {
    if (!carrierBreakdown.length) return;

    const headers = ["Carrier", "Policies", "Total Premium", "Agency Commission", "Avg Comm %"];
    const rows = carrierBreakdown.map(c => [
      c.carrier,
      c.policyCount,
      c.totalPremium.toFixed(2),
      c.totalAgencyComm.toFixed(2),
      (c.avgCommPct * 100).toFixed(2) + "%",
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prl-carrier-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] shadow-lg">
          <span className="text-3xl">📊</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-1">
            Policy Revenue Ledger Reports
          </h2>
          <p className="text-[var(--foreground-muted)] flex items-center gap-2">
            <span className="text-lg">📈</span>
            Build, export, and schedule PRL-focused reports
          </p>
        </div>
      </div>

      {/* Date Filters */}
      <div className="bg-[var(--card-background)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-[var(--foreground)] mb-4">Date Range</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-[var(--foreground-muted)] mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-background)] text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--foreground-muted)] mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-background)] text-[var(--foreground)]"
            />
          </div>
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); }}
            className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!carrierBreakdown.length}
            className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] transition-colors disabled:opacity-50"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--foreground-muted)]">Loading reports...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[var(--card-background)] border border-[var(--border-color)] rounded-xl p-4">
                <p className="text-xs text-[var(--foreground-muted)]">Total Policies</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{summary.totalPolicies}</p>
              </div>
              <div className="bg-[var(--card-background)] border border-[var(--border-color)] rounded-xl p-4">
                <p className="text-xs text-[var(--foreground-muted)]">Total Premium</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{formatCurrency(summary.totalPremium)}</p>
              </div>
              <div className="bg-[var(--card-background)] border border-[var(--border-color)] rounded-xl p-4">
                <p className="text-xs text-[var(--foreground-muted)]">Agency Commission</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalAgencyComm)}</p>
              </div>
              <div className="bg-[var(--card-background)] border border-[var(--border-color)] rounded-xl p-4">
                <p className="text-xs text-[var(--foreground-muted)]">Balance Due</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.totalBalance)}</p>
              </div>
            </div>
          )}

          {/* Carrier Breakdown Table */}
          <div className="bg-[var(--card-background)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-[var(--foreground)] mb-4">📦 Carrier Breakdown</h3>
            {carrierBreakdown.length === 0 ? (
              <p className="text-[var(--foreground-muted)] text-center py-8">No carrier data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="text-left py-3 px-4 font-semibold text-[var(--foreground)]">Carrier</th>
                      <th className="text-right py-3 px-4 font-semibold text-[var(--foreground)]">Policies</th>
                      <th className="text-right py-3 px-4 font-semibold text-[var(--foreground)]">Premium</th>
                      <th className="text-right py-3 px-4 font-semibold text-[var(--foreground)]">Agency Comm</th>
                      <th className="text-right py-3 px-4 font-semibold text-[var(--foreground)]">Avg Comm %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrierBreakdown.map((c, idx) => (
                      <tr key={idx} className="border-b border-[var(--border-color)] hover:bg-[var(--background-secondary)]">
                        <td className="py-3 px-4 text-[var(--foreground)]">{c.carrier}</td>
                        <td className="py-3 px-4 text-right text-[var(--foreground)]">{c.policyCount}</td>
                        <td className="py-3 px-4 text-right text-[var(--foreground)]">{formatCurrency(c.totalPremium)}</td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-medium">{formatCurrency(c.totalAgencyComm)}</td>
                        <td className="py-3 px-4 text-right text-[var(--foreground)]">{formatPercent(c.avgCommPct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Monthly Breakdown Table */}
          <div className="bg-[var(--card-background)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-[var(--foreground)] mb-4">📅 Monthly Breakdown</h3>
            {monthlyBreakdown.length === 0 ? (
              <p className="text-[var(--foreground-muted)] text-center py-8">No monthly data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="text-left py-3 px-4 font-semibold text-[var(--foreground)]">Month</th>
                      <th className="text-right py-3 px-4 font-semibold text-[var(--foreground)]">Policies</th>
                      <th className="text-right py-3 px-4 font-semibold text-[var(--foreground)]">Premium</th>
                      <th className="text-right py-3 px-4 font-semibold text-[var(--foreground)]">Agency Comm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyBreakdown.map((m, idx) => (
                      <tr key={idx} className="border-b border-[var(--border-color)] hover:bg-[var(--background-secondary)]">
                        <td className="py-3 px-4 text-[var(--foreground)]">{m.monthLabel}</td>
                        <td className="py-3 px-4 text-right text-[var(--foreground)]">{m.policyCount}</td>
                        <td className="py-3 px-4 text-right text-[var(--foreground)]">{formatCurrency(m.totalPremium)}</td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-medium">{formatCurrency(m.totalAgencyComm)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <footer className="mt-12 border-t-2 border-[var(--border-color)] bg-gradient-to-r from-[var(--background-secondary)] to-[var(--background)] py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-2xl">🏢</span>
          <p className="font-bold text-[var(--accent-primary)]">Metro Point Technology</p>
        </div>
        <p className="text-xs text-[var(--foreground-muted)] mb-2">
          <a href="/terms" className="underline hover:text-[var(--accent-primary)] transition-colors">Terms of Service</a> |{' '}
          <a href="/privacy" className="underline hover:text-[var(--accent-primary)] transition-colors">Privacy Policy</a> |{' '}
          © 2025 All rights reserved
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm">®</span>
          <p className="text-xs text-[var(--foreground-subtle)]">Metro Point is a registered trademark</p>
        </div>
      </footer>
    </div>
  );
}
