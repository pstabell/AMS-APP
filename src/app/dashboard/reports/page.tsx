"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCurrency } from "@/lib/calculations";
import type {
  SummaryStats,
  CarrierBreakdown,
  MonthlyBreakdown,
} from "@/lib/reports";

type ReportsResponse = {
  summary: SummaryStats;
  carrierBreakdown: CarrierBreakdown[];
  monthlyBreakdown: MonthlyBreakdown[];
  policiesCount: number;
};

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [reportType, setReportType] = useState("summary");
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [carrierBreakdown, setCarrierBreakdown] = useState<CarrierBreakdown[]>([]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyBreakdown[]>([]);
  const [policiesCount, setPoliciesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const response = await fetch(
        `/api/reports${params.toString() ? `?${params.toString()}` : ""}`
      );

      if (!response.ok) {
        throw new Error("Unable to load reports data.");
      }

      const data = (await response.json()) as ReportsResponse;

      setSummary(data.summary ?? null);
      setCarrierBreakdown(Array.isArray(data.carrierBreakdown) ? data.carrierBreakdown : []);
      setMonthlyBreakdown(Array.isArray(data.monthlyBreakdown) ? data.monthlyBreakdown : []);
      setPoliciesCount(data.policiesCount ?? 0);
    } catch (err) {
      console.error("Reports load failed:", err);
      setError("Unable to load reports data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const applyDatePreset = (preset: string) => {
    setDatePreset(preset);
    if (preset === "custom") return;

    const today = new Date();
    const to = today.toISOString().split("T")[0];

    if (preset === "all") {
      setDateFrom("");
      setDateTo("");
      return;
    }

    let from = "";
    if (preset === "month") {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      from = monthStart.toISOString().split("T")[0];
    } else if (preset === "quarter") {
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
      const quarterStart = new Date(today.getFullYear(), quarterStartMonth, 1);
      from = quarterStart.toISOString().split("T")[0];
    } else if (preset === "year") {
      const yearStart = new Date(today.getFullYear(), 0, 1);
      from = yearStart.toISOString().split("T")[0];
    } else if (preset === "last30") {
      const date = new Date(today);
      date.setDate(date.getDate() - 30);
      from = date.toISOString().split("T")[0];
    } else if (preset === "last90") {
      const date = new Date(today);
      date.setDate(date.getDate() - 90);
      from = date.toISOString().split("T")[0];
    }

    setDateFrom(from);
    setDateTo(to);
  };

  const exportToCSV = () => {
    if (!summary || carrierBreakdown.length === 0) return;

    let csvData: string[][] = [];
    let headers: string[] = [];

    if (reportType === "summary") {
      headers = ["Metric", "Value"];
      csvData = [
        ["Total Policies", summary.totalPolicies.toString()],
        ["Total Premium", formatCurrency(summary.totalPremium)],
        ["Total Commission", formatCurrency(summary.totalAgentComm)],
        ["Date Range", dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : "All Time"]
      ];
    } else if (reportType === "by-carrier") {
      headers = ["Carrier", "Policies", "Premium", "Agency Comm", "Agent Comm", "Avg Comm %"];
      csvData = carrierBreakdown.map(row => [
        row.carrier,
        row.policyCount.toString(),
        row.totalPremium.toString(),
        row.totalAgencyComm.toString(),
        row.totalAgentComm.toString(),
        row.avgCommPct.toFixed(1) + "%"
      ]);
    } else if (reportType === "detailed") {
      headers = ["Month", "Policies", "Premium", "Agency Comm", "Agent Comm"];
      csvData = monthlyBreakdown.map(row => [
        row.monthLabel,
        row.policyCount.toString(),
        row.totalPremium.toString(),
        row.totalAgencyComm.toString(),
        row.totalAgentComm.toString()
      ]);
    }

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportType}-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    {
      label: "Total Policies",
      value: summary?.totalPolicies ?? 0,
      accent: "text-slate-900",
      hint: `${policiesCount} records`,
    },
    {
      label: "Total Premium",
      value: formatCurrency(summary?.totalPremium ?? 0),
      accent: "text-slate-900",
      hint: "Premium sold",
    },
    {
      label: "Total Commission",
      value: formatCurrency(summary?.totalAgentComm ?? 0),
      accent: "text-slate-900",
      hint: "Agent commission",
    },
  ];

  return (
    <>
    <style jsx>{`
      @media print {
        .no-print {
          display: none !important;
        }
        .print-break {
          page-break-after: always;
        }
        body {
          font-size: 12px !important;
        }
        table {
          font-size: 11px !important;
        }
        .card {
          border: 1px solid #ccc !important;
          box-shadow: none !important;
          margin-bottom: 20px !important;
          page-break-inside: avoid;
        }
      }
    `}</style>
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] shadow-lg">
          <span className="text-3xl">📊</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-1">Commission Reports</h2>
          <p className="text-[var(--foreground-muted)] flex items-center gap-2">
            <span className="text-lg">📈</span>
            Commission analytics • Performance insights
          </p>
        </div>
      </div>

      <div className="card no-print">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-secondary-hover)] shadow-md">
            <span className="text-xl">📅</span>
          </div>
          <h3 className="text-xl font-bold text-[var(--foreground)]">Date Range & Report Type</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <span className="text-lg">📊</span>
              Report Type
            </label>
            <select
              className="w-full rounded-xl border-2 border-[var(--border-color)] bg-[var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-20 transition-all"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="summary">Summary Report</option>
              <option value="detailed">Detailed Report</option>
              <option value="by-carrier">By Carrier</option>
              <option value="by-transaction">By Transaction Type</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <span className="text-lg">🎯</span>
              Quick Range
            </label>
            <select
              className="w-full rounded-xl border-2 border-[var(--border-color)] bg-[var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-20 transition-all"
              value={datePreset}
              onChange={(e) => applyDatePreset(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">Year to Date</option>
              <option value="last30">Last 30 Days</option>
              <option value="last90">Last 90 Days</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <span className="text-lg">📅</span>
              Date From
            </label>
            <input
              type="date"
              className="w-full rounded-xl border-2 border-[var(--border-color)] bg-[var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-20 transition-all"
              value={dateFrom}
              onChange={(e) => {
                setDatePreset("custom");
                setDateFrom(e.target.value);
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <span className="text-lg">📅</span>
              Date To
            </label>
            <input
              type="date"
              className="w-full rounded-xl border-2 border-[var(--border-color)] bg-[var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-20 transition-all"
              value={dateTo}
              onChange={(e) => {
                setDatePreset("custom");
                setDateTo(e.target.value);
              }}
            />
          </div>

          <div className="flex items-end md:col-span-2">
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={loadReport}
                disabled={isLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="text-lg">{isLoading ? "⏳" : "🔍"}</span>
                {isLoading ? "Loading..." : "Run Report"}
              </button>
              <button
                type="button"
                onClick={() => exportToCSV()}
                disabled={isLoading || !summary}
                className="rounded-xl border-2 border-green-500 bg-green-500 px-4 py-3 text-sm font-bold text-white shadow-lg hover:border-green-600 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all disabled:opacity-50 flex items-center gap-2"
                title="Export to CSV"
              >
                <span className="text-lg">📊</span>
                CSV
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                disabled={isLoading}
                className="rounded-xl border-2 border-blue-500 bg-blue-500 px-4 py-3 text-sm font-bold text-white shadow-lg hover:border-blue-600 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all disabled:opacity-50 flex items-center gap-2"
                title="Print Report"
              >
                <span className="text-lg">🖨️</span>
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Metro Point Technology - Commission Report</h1>
        <div className="text-sm text-slate-600 mt-2">
          <p>Report Type: {reportType === "summary" ? "Summary Report" : 
                         reportType === "detailed" ? "Detailed Report" :
                         reportType === "by-carrier" ? "By Carrier" : "By Transaction Type"}</p>
          {dateFrom && dateTo && (
            <p>Date Range: {dateFrom} to {dateTo}</p>
          )}
          <p>Generated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border-2 border-[var(--error-red)] bg-gradient-to-br from-[var(--background)] to-[var(--background-secondary)] px-6 py-4 text-sm text-[var(--error-red)] shadow-lg flex items-center gap-3 no-print">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold">Report Error</p>
            <p className="text-xs opacity-80">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {summaryCards.map((card, index) => {
          const icons = ["🏢", "💰", "📊"];
          const gradients = [
            "from-[var(--accent-primary)] to-[var(--accent-primary-hover)]",
            "from-[var(--accent-secondary)] to-[var(--accent-secondary-hover)]",
            "from-[var(--highlight-amber)] to-[var(--accent-primary)]"
          ];
          return (
          <div
            key={card.label}
            className="card group cursor-pointer hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${gradients[index]} shadow-md`}>
                <span className="text-2xl">{icons[index]}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-primary)] mb-1">
                  {card.label}
                </p>
                <p className={`text-2xl font-bold text-[var(--foreground)] group-hover:text-[var(--accent-primary)] transition-colors`}>
                  {isLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    card.value
                  )}
                </p>
              </div>
            </div>
            <p className="text-xs text-[var(--foreground-muted)]">{card.hint}</p>
            <div className="mt-3 h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${gradients[index]} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: isLoading ? '0%' : '100%' }}
              ></div>
            </div>
          </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] shadow-md">
              <span className="text-2xl">📈</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[var(--foreground)]">By Carrier</h3>
              <span className="text-sm text-[var(--foreground-muted)]">
                {carrierBreakdown.length} carriers
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table-warm w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">🏢 Carrier</th>
                  <th className="text-right">📄 Policies</th>
                  <th className="text-right">💰 Premium</th>
                  <th className="text-right">💎 Agency Comm</th>
                  <th className="text-right">🎯 Agent Comm</th>
                  <th className="text-right">📊 Avg Comm %</th>
                </tr>
              </thead>
              <tbody>
                {carrierBreakdown.length === 0 && !isLoading && (
                  <tr>
                    <td className="text-center text-[var(--foreground-muted)] py-8" colSpan={6}>
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-3xl">📊</span>
                        <div>
                          <p className="font-semibold">No carrier data</p>
                          <p className="text-xs">No data available for this range</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {carrierBreakdown.map((row) => (
                  <tr key={row.carrier} className="group">
                    <td className="font-semibold text-[var(--foreground)]">{row.carrier}</td>
                    <td className="text-right text-[var(--foreground-muted)]">{row.policyCount}</td>
                    <td className="text-right text-[var(--accent-secondary)] font-semibold">
                      {formatCurrency(row.totalPremium)}
                    </td>
                    <td className="text-right text-[var(--accent-primary)] font-semibold">
                      {formatCurrency(row.totalAgencyComm)}
                    </td>
                    <td className="text-right text-[var(--highlight-amber)] font-semibold">
                      {formatCurrency(row.totalAgentComm)}
                    </td>
                    <td className="text-right text-[var(--foreground)] font-semibold">
                      {row.avgCommPct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="mb-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-secondary-hover)] shadow-md">
              <span className="text-2xl">📅</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[var(--foreground)]">Monthly Breakdown</h3>
              <span className="text-sm text-[var(--foreground-muted)]">
                {monthlyBreakdown.length} months
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table-warm w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">📅 Month</th>
                  <th className="text-right">📄 Policies</th>
                  <th className="text-right">💰 Premium</th>
                  <th className="text-right">💎 Agency Comm</th>
                  <th className="text-right">🎯 Agent Comm</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.length === 0 && !isLoading && (
                  <tr>
                    <td className="text-center text-[var(--foreground-muted)] py-8" colSpan={5}>
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-3xl">📅</span>
                        <div>
                          <p className="font-semibold">No monthly data</p>
                          <p className="text-xs">No data available for this range</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {monthlyBreakdown.map((row) => (
                  <tr key={row.month} className="group">
                    <td className="font-semibold text-[var(--foreground)]">{row.monthLabel}</td>
                    <td className="text-right text-[var(--foreground-muted)]">{row.policyCount}</td>
                    <td className="text-right text-[var(--accent-secondary)] font-semibold">
                      {formatCurrency(row.totalPremium)}
                    </td>
                    <td className="text-right text-[var(--accent-primary)] font-semibold">
                      {formatCurrency(row.totalAgencyComm)}
                    </td>
                    <td className="text-right text-[var(--highlight-amber)] font-semibold">
                      {formatCurrency(row.totalAgentComm)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          © 2025 All rights reserved
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm">®</span>
          <p className="text-xs text-[var(--foreground-subtle)]">Metro Point is a registered trademark</p>
        </div>
      </footer>
    </>
  );
}
