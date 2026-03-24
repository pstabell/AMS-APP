"use client";

import { useState, useMemo } from "react";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { TransactionIndicator, type IndicatorType } from "./TransactionLegend";
import { type ColumnConfig } from "./ColumnCustomization";

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
  indicator: IndicatorType;
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

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type PRLDataTableProps = {
  viewMode: 'aggregated' | 'detailed';
  data: PRLTransaction[] | PRLPolicy[];
  columns: ColumnConfig[];
  pagination: Pagination;
  loading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
};

function formatValue(value: any, key: string, viewMode: 'aggregated' | 'detailed'): React.ReactNode {
  if (value === null || value === undefined) return '';

  switch (key) {
    case 'effectiveDate':
    case 'lastStatementMonth':
      return formatDate(value);
    
    case 'statementMonth':
      if (typeof value === 'string' && value.includes('-')) {
        const [year, month] = value.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
      }
      return value;
    
    case 'premiumSold':
    case 'totalPremium':
    case 'agencyCommission':
    case 'totalAgencyComm':
    case 'agentCommission':
    case 'totalAgentComm':
    case 'paidAmount':
    case 'totalPaid':
    case 'balance':
      return (
        <span className={key === 'balance' && Number(value) < 0 ? 'text-red-600' : ''}>
          {formatCurrency(value)}
        </span>
      );
    
    case 'indicator':
      if (viewMode === 'detailed') {
        return <TransactionIndicator type={value as IndicatorType} showLabel size="sm" />;
      }
      return value;
    
    case 'indicators':
      if (viewMode === 'aggregated') {
        const policy = value as PRLPolicy;
        const indicators = [];
        if (policy.hasVoids) indicators.push(<TransactionIndicator key="void" type="VOID" size="xs" />);
        if (policy.hasEndorsements) indicators.push(<TransactionIndicator key="end" type="END" size="xs" />);
        if (policy.hasCancellations) indicators.push(<TransactionIndicator key="can" type="CAN" size="xs" />);
        
        return (
          <div className="flex gap-1">
            {indicators.length > 0 ? indicators : <span className="text-xs text-slate-400">None</span>}
          </div>
        );
      }
      return '';
    
    case 'transactionCount':
      return <span className="font-medium">{value}</span>;
    
    default:
      return value;
  }
}

export default function PRLDataTable({
  viewMode,
  data,
  columns,
  pagination,
  loading,
  onPageChange,
  onLimitChange,
  onSort,
  sortColumn,
  sortDirection,
}: PRLDataTableProps) {
  const visibleColumns = useMemo(
    () => columns.filter(col => col.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const handleSort = (columnKey: string) => {
    if (!onSort) return;
    
    const newDirection = 
      sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newDirection);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return (
        <svg className="h-4 w-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  // Calculate totals for aggregated view
  const totals = useMemo(() => {
    if (viewMode !== 'aggregated' || data.length === 0) return null;
    
    const policies = data as PRLPolicy[];
    return {
      transactionCount: policies.reduce((sum, p) => sum + p.transactionCount, 0),
      totalPremium: policies.reduce((sum, p) => sum + p.totalPremium, 0),
      totalAgentComm: policies.reduce((sum, p) => sum + p.totalAgentComm, 0),
      totalPaid: policies.reduce((sum, p) => sum + p.totalPaid, 0),
      balance: policies.reduce((sum, p) => sum + p.balance, 0),
    };
  }, [data, viewMode]);

  const startRecord = (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Table Header */}
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {viewMode === 'aggregated' ? 'Policies Summary' : 'Transaction Details'}
            </h3>
            <p className="text-sm text-slate-600">
              Showing {startRecord}-{endRecord} of {pagination.total} {viewMode === 'aggregated' ? 'policies' : 'transactions'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Show:</label>
            <select
              value={pagination.limit}
              onChange={(e) => onLimitChange(parseInt(e.target.value))}
              className="rounded border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              {visibleColumns.map(column => (
                <th
                  key={column.key}
                  style={{ width: `${column.width}px`, minWidth: `${column.width}px` }}
                  className={`border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 ${
                    onSort ? 'cursor-pointer hover:bg-slate-100' : ''
                  }`}
                  onClick={() => onSort && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {onSort && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {loading ? (
              <tr>
                <td 
                  colSpan={visibleColumns.length} 
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td 
                  colSpan={visibleColumns.length} 
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No {viewMode === 'aggregated' ? 'policies' : 'transactions'} found for the selected criteria.
                </td>
              </tr>
            ) : (
              <>
                {data.map((row, index) => (
                  <tr 
                    key={viewMode === 'detailed' ? (row as PRLTransaction).id : (row as PRLPolicy).policyNumber}
                    className={`border-b border-slate-100 hover:bg-slate-50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                    }`}
                  >
                    {visibleColumns.map(column => (
                      <td
                        key={column.key}
                        style={{ width: `${column.width}px`, minWidth: `${column.width}px` }}
                        className="px-4 py-3 text-sm text-slate-900"
                      >
                        {formatValue(
                          column.key === 'indicators' ? row : (row as any)[column.key],
                          column.key,
                          viewMode
                        )}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Totals Row for Aggregated View */}
                {totals && (
                  <tr className="border-t-2 border-slate-300 bg-slate-100 font-semibold">
                    {visibleColumns.map(column => (
                      <td
                        key={column.key}
                        style={{ width: `${column.width}px`, minWidth: `${column.width}px` }}
                        className="px-4 py-3 text-sm"
                      >
                        {column.key === 'policyNumber' ? 'TOTALS' :
                         column.key === 'transactionCount' ? totals.transactionCount :
                         column.key === 'totalPremium' ? formatCurrency(totals.totalPremium) :
                         column.key === 'totalAgentComm' ? formatCurrency(totals.totalAgentComm) :
                         column.key === 'totalPaid' ? formatCurrency(totals.totalPaid) :
                         column.key === 'balance' ? (
                           <span className={totals.balance < 0 ? 'text-red-600' : ''}>
                             {formatCurrency(totals.balance)}
                           </span>
                         ) : ''}
                      </td>
                    ))}
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(1)}
                disabled={pagination.page === 1}
                className="rounded border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="rounded border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const startPage = Math.max(1, pagination.page - 2);
                  const pageNum = startPage + i;
                  
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`rounded px-3 py-1 text-sm ${
                        pageNum === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="rounded border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => onPageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
                className="rounded border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}