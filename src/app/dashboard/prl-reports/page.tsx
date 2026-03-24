"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ColumnCustomization, { type ColumnConfig, type ColumnTemplate } from "@/components/reports/ColumnCustomization";
import TransactionLegend from "@/components/reports/TransactionLegend";
import PRLDataTable from "@/components/reports/PRLDataTable";
import { exportPRLToCSV, printPRLReport } from "@/lib/prl-export";
import { formatCurrency } from "@/lib/calculations";

type PRLTransaction = {
  id: string;
  policyNumber: string;
  effectiveDate: string;
  statementMonth: string;
  customer: string;
  carrier: string;
  lineOfBusiness: string;
  transactionType: string;
  status: string;
  premiumSold: number;
  agencyCommission: number;
  agentCommission: number;
  paidAmount: number;
  balance: number;
  indicator: 'STMT' | 'VOID' | 'END' | 'CAN' | 'OTHER';
};

type PRLPolicy = {
  policyNumber: string;
  customer: string;
  carrier: string;
  lineOfBusiness: string;
  effectiveDate: string;
  lastStatementMonth: string;
  transactionCount: number;
  totalPremium: number;
  totalAgencyComm: number;
  totalAgentComm: number;
  totalPaid: number;
  balance: number;
  hasVoids: boolean;
  hasEndorsements: boolean;
  hasCancellations: boolean;
};

type PRLSummary = {
  totalPolicies: number;
  totalTransactions: number;
  totalPremium: number;
  totalAgencyComm: number;
  totalAgentComm: number;
  totalPaid: number;
  totalBalance: number;
  statementMonths: string[];
  transactionCounts: {
    stmt: number;
    void: number;
    end: number;
    can: number;
    other: number;
  };
};

type ReportParameters = {
  reportGenerated: string;
  reportType: string;
  viewMode: 'aggregated' | 'detailed';
  statementMonth: string | null;
  balanceFilter: 'all' | 'positive' | 'negative' | 'zero';
  totalRecords: number;
  selectedColumns: string[];
  dataAggregation: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type PRLReportsResponse = {
  viewMode: 'aggregated' | 'detailed';
  summary: PRLSummary;
  transactions?: PRLTransaction[];
  policies?: PRLPolicy[];
  parameters: ReportParameters;
  pagination: Pagination;
};

const DEFAULT_COLUMNS = {
  aggregated: [
    { key: 'policyNumber', label: 'Policy Number', visible: true, width: 150, order: 1 },
    { key: 'customer', label: 'Customer', visible: true, width: 200, order: 2 },
    { key: 'carrier', label: 'Carrier', visible: true, width: 120, order: 3 },
    { key: 'lineOfBusiness', label: 'Line of Business', visible: true, width: 140, order: 4 },
    { key: 'transactionCount', label: 'Transaction Count', visible: true, width: 120, order: 5 },
    { key: 'effectiveDate', label: 'Effective Date', visible: true, width: 120, order: 6 },
    { key: 'lastStatementMonth', label: 'Last Statement', visible: true, width: 120, order: 7 },
    { key: 'totalPremium', label: 'Total Premium', visible: true, width: 120, order: 8 },
    { key: 'totalAgentComm', label: 'Agent Commission', visible: true, width: 130, order: 9 },
    { key: 'totalPaid', label: 'Paid Amount', visible: true, width: 120, order: 10 },
    { key: 'balance', label: 'Balance', visible: true, width: 120, order: 11 },
    { key: 'indicators', label: 'Indicators', visible: true, width: 100, order: 12 },
  ],
  detailed: [
    { key: 'policyNumber', label: 'Policy Number', visible: true, width: 150, order: 1 },
    { key: 'effectiveDate', label: 'Effective Date', visible: true, width: 120, order: 2 },
    { key: 'statementMonth', label: 'Statement Month', visible: true, width: 120, order: 3 },
    { key: 'customer', label: 'Customer', visible: true, width: 200, order: 4 },
    { key: 'carrier', label: 'Carrier', visible: true, width: 120, order: 5 },
    { key: 'lineOfBusiness', label: 'Line of Business', visible: true, width: 140, order: 6 },
    { key: 'transactionType', label: 'Transaction Type', visible: true, width: 140, order: 7 },
    { key: 'premiumSold', label: 'Premium', visible: true, width: 120, order: 8 },
    { key: 'agentCommission', label: 'Agent Commission', visible: true, width: 130, order: 9 },
    { key: 'paidAmount', label: 'Paid Amount', visible: true, width: 120, order: 10 },
    { key: 'balance', label: 'Balance', visible: true, width: 120, order: 11 },
    { key: 'indicator', label: 'Indicator', visible: true, width: 100, order: 12 },
  ],
};

const DEFAULT_TEMPLATES: ColumnTemplate[] = [
  {
    id: 'commission-focus',
    name: 'Commission Focus',
    description: 'Focused on commission analysis',
    columns: DEFAULT_COLUMNS.aggregated.map(col => ({
      ...col,
      visible: ['policyNumber', 'customer', 'carrier', 'totalAgentComm', 'totalPaid', 'balance'].includes(col.key)
    }))
  },
  {
    id: 'full-overview',
    name: 'Full Overview', 
    description: 'All available columns',
    columns: DEFAULT_COLUMNS.aggregated
  }
];

export default function EnhancedPRLReportsPage() {
  const { user } = useAuth();

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statementMonth, setStatementMonth] = useState("");
  const [viewMode, setViewMode] = useState<'aggregated' | 'detailed'>('aggregated');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'positive' | 'negative' | 'zero'>('all');
  
  // Data
  const [summary, setSummary] = useState<PRLSummary | null>(null);
  const [transactions, setTransactions] = useState<PRLTransaction[]>([]);
  const [policies, setPolicies] = useState<PRLPolicy[]>([]);
  const [parameters, setParameters] = useState<ReportParameters | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Column Management
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS.aggregated);
  const [templates, setTemplates] = useState<ColumnTemplate[]>(DEFAULT_TEMPLATES);

  // Update columns when view mode changes
  useEffect(() => {
    setColumns(DEFAULT_COLUMNS[viewMode]);
  }, [viewMode]);

  const loadReport = useCallback(async (page = 1, limit = pagination.limit) => {
    if (!user?.email) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("userEmail", user.email);
      params.set("viewMode", viewMode);
      params.set("balanceFilter", balanceFilter);
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (statementMonth) params.set("statementMonth", statementMonth);
      if (sortColumn) {
        params.set("sortColumn", sortColumn);
        params.set("sortDirection", sortDirection);
      }

      const response = await fetch(`/api/prl-reports?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Unable to load PRL reports data.");
      }

      const data = (await response.json()) as PRLReportsResponse;
      
      setSummary(data.summary);
      setParameters(data.parameters);
      setPagination(data.pagination);
      
      if (data.viewMode === 'detailed') {
        setTransactions(data.transactions || []);
        setPolicies([]);
      } else {
        setPolicies(data.policies || []);
        setTransactions([]);
      }

    } catch (err) {
      console.error("PRL report load failed:", err);
      setError("Unable to load PRL report data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, viewMode, balanceFilter, dateFrom, dateTo, statementMonth, sortColumn, sortDirection]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handlePageChange = (page: number) => {
    loadReport(page, pagination.limit);
  };

  const handleLimitChange = (limit: number) => {
    loadReport(1, limit);
  };

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const handleColumnChange = (newColumns: ColumnConfig[]) => {
    setColumns(newColumns);
  };

  const handleTemplateChange = (template: ColumnTemplate) => {
    setColumns(template.columns);
  };

  const handleSaveTemplate = (name: string, description: string) => {
    const newTemplate: ColumnTemplate = {
      id: `template-${Date.now()}`,
      name,
      description,
      columns: [...columns],
    };
    setTemplates(prev => [...prev, newTemplate]);
  };

  const handleExport = () => {
    if (!summary || !parameters) return;
    
    const data = viewMode === 'detailed' ? transactions : policies;
    exportPRLToCSV(data, summary, parameters, columns, viewMode);
  };

  const handlePrint = () => {
    if (!summary || !parameters) return;
    
    const data = viewMode === 'detailed' ? transactions : policies;
    printPRLReport(data, summary, parameters, columns, viewMode);
  };

  const currentData = viewMode === 'detailed' ? transactions : policies;

  const summaryCards = useMemo(() => [
    {
      label: "Total Policies",
      value: summary?.totalPolicies?.toLocaleString() || "0",
      hint: "Unique policies",
    },
    {
      label: "Total Transactions", 
      value: summary?.totalTransactions?.toLocaleString() || "0",
      hint: "All transactions",
    },
    {
      label: "Total Premium",
      value: formatCurrency(summary?.totalPremium || 0),
      hint: "Premium written",
    },
    {
      label: "Agent Commission",
      value: formatCurrency(summary?.totalAgentComm || 0),
      hint: "Total projected",
    },
    {
      label: "Paid Amount",
      value: formatCurrency(summary?.totalPaid || 0),
      hint: "Amount paid",
    },
    {
      label: "Outstanding Balance",
      value: formatCurrency(summary?.totalBalance || 0),
      hint: "Amount due",
      isNegative: (summary?.totalBalance || 0) < 0,
    },
  ], [summary]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Policy Revenue Ledger Reports
          </h2>
          <p className="text-sm text-slate-600">
            Comprehensive revenue analytics with transaction details and policy summaries.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <ColumnCustomization
            viewMode={viewMode}
            columns={columns}
            templates={templates}
            onColumnsChange={handleColumnChange}
            onTemplateChange={handleTemplateChange}
            onSaveTemplate={handleSaveTemplate}
          />
          
          <button
            onClick={handlePrint}
            disabled={!summary || isLoading}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          
          <button
            onClick={handleExport}
            disabled={!summary || isLoading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* View Mode Toggle */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">View Mode</label>
            <div className="flex rounded-lg border border-slate-200 p-1">
              <button
                onClick={() => setViewMode('aggregated')}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                  viewMode === 'aggregated'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Aggregated
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                  viewMode === 'detailed'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Detailed
              </button>
            </div>
          </div>

          {/* Date Filters */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Date From</label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Date To</label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {/* Statement Month */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Statement Month</label>
            <input
              type="month"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500"
              value={statementMonth}
              onChange={(e) => setStatementMonth(e.target.value)}
            />
          </div>

          {/* Balance Filter */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Balance Filter</label>
            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value as typeof balanceFilter)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500"
            >
              <option value="all">All Balances</option>
              <option value="positive">Positive Only</option>
              <option value="negative">Negative Only</option>
              <option value="zero">Zero Balance</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => loadReport(1, pagination.limit)}
              disabled={isLoading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {isLoading ? "Loading..." : "Run Report"}
            </button>
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setStatementMonth("");
                setBalanceFilter("all");
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Reset Filters
            </button>
          </div>

          {parameters && (
            <div className="text-xs text-slate-500">
              {parameters.totalRecords.toLocaleString()} records | Generated: {new Date(parameters.reportGenerated).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 lg:grid-cols-6">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {card.label}
            </p>
            <p className={`mt-2 text-lg font-semibold ${card.isNegative ? 'text-red-600' : 'text-slate-900'}`}>
              {isLoading ? "..." : card.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
          </div>
        ))}
      </div>

      {/* Transaction Legend */}
      {summary && summary.transactionCounts && (
        <TransactionLegend counts={summary.transactionCounts} />
      )}

      {/* Data Table */}
      <PRLDataTable
        viewMode={viewMode}
        data={currentData}
        columns={columns}
        pagination={pagination}
        loading={isLoading}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onSort={handleSort}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
      />
    </div>
  );
}