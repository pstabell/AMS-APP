import { formatCurrency, formatDate } from "./calculations";
import { downloadFile } from "./reports";

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
  indicator: string;
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

type ColumnConfig = {
  key: string;
  label: string;
  visible: boolean;
  width: number;
  order: number;
};

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function formatStatementMonth(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [year, month] = monthKey.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

export function exportPRLToCSV(
  data: PRLTransaction[] | PRLPolicy[],
  summary: PRLSummary,
  parameters: ReportParameters,
  columns: ColumnConfig[],
  viewMode: 'aggregated' | 'detailed'
) {
  const lines: string[] = [];
  const visibleColumns = columns.filter(col => col.visible).sort((a, b) => a.order - b.order);

  // Report Header
  lines.push(escapeCSV('Policy Revenue Ledger Report'));
  lines.push('');

  // Report Parameters
  lines.push(escapeCSV('Report Parameters'));
  lines.push(`Generated,${escapeCSV(new Date(parameters.reportGenerated).toLocaleString())}`);
  lines.push(`Report Type,${escapeCSV(parameters.reportType)}`);
  lines.push(`View Mode,${escapeCSV(parameters.viewMode === 'aggregated' ? 'Aggregated by Policy' : 'Detailed Transactions')}`);
  lines.push(`Statement Month,${escapeCSV(parameters.statementMonth ? formatStatementMonth(parameters.statementMonth) : 'All Periods')}`);
  lines.push(`Balance Filter,${escapeCSV(parameters.balanceFilter === 'all' ? 'All Balances' : parameters.balanceFilter.charAt(0).toUpperCase() + parameters.balanceFilter.slice(1) + ' Only')}`);
  lines.push(`Total Records,${escapeCSV(parameters.totalRecords)}`);
  lines.push(`Data Aggregation,${escapeCSV(parameters.dataAggregation)}`);
  lines.push(`Selected Columns,${escapeCSV(visibleColumns.length)} (${visibleColumns.map(col => col.label).join('; ')})`);
  lines.push('');

  // Executive Summary
  lines.push(escapeCSV('Executive Summary'));
  lines.push(`Total Policies,${escapeCSV(summary.totalPolicies)}`);
  lines.push(`Total Transactions,${escapeCSV(summary.totalTransactions)}`);
  lines.push(`Total Premium,${escapeCSV(summary.totalPremium.toFixed(2))}`);
  lines.push(`Total Agency Commission,${escapeCSV(summary.totalAgencyComm.toFixed(2))}`);
  lines.push(`Total Agent Commission,${escapeCSV(summary.totalAgentComm.toFixed(2))}`);
  lines.push(`Total Paid Amount,${escapeCSV(summary.totalPaid.toFixed(2))}`);
  lines.push(`Outstanding Balance,${escapeCSV(summary.totalBalance.toFixed(2))}`);
  lines.push('');

  // Transaction Breakdown
  lines.push(escapeCSV('Transaction Type Breakdown'));
  lines.push(`Statement/Reconciliation (STMT),${escapeCSV(summary.transactionCounts.stmt)}`);
  lines.push(`Voided Transactions (VOID),${escapeCSV(summary.transactionCounts.void)}`);
  lines.push(`Endorsements (END),${escapeCSV(summary.transactionCounts.end)}`);
  lines.push(`Cancellations (CAN),${escapeCSV(summary.transactionCounts.can)}`);
  lines.push(`Other Transactions,${escapeCSV(summary.transactionCounts.other)}`);
  lines.push('');

  // Statement Months
  if (summary.statementMonths.length > 0) {
    lines.push(escapeCSV('Statement Months Covered'));
    summary.statementMonths.forEach(month => {
      lines.push(escapeCSV(formatStatementMonth(month)));
    });
    lines.push('');
  }

  // Data Table
  lines.push(escapeCSV(viewMode === 'aggregated' ? 'Policy Summary Data' : 'Transaction Detail Data'));
  
  // Headers
  lines.push(visibleColumns.map(col => escapeCSV(col.label)).join(','));

  // Data Rows
  data.forEach(row => {
    const rowData = visibleColumns.map(col => {
      const value = (row as any)[col.key];
      
      switch (col.key) {
        case 'effectiveDate':
        case 'lastStatementMonth':
          return escapeCSV(value ? formatDate(value) : '');
        
        case 'statementMonth':
          return escapeCSV(formatStatementMonth(value || ''));
        
        case 'premiumSold':
        case 'totalPremium':
        case 'agencyCommission':
        case 'totalAgencyComm':
        case 'agentCommission':
        case 'totalAgentComm':
        case 'paidAmount':
        case 'totalPaid':
        case 'balance':
          return escapeCSV(typeof value === 'number' ? value.toFixed(2) : '0.00');
        
        case 'indicators':
          if (viewMode === 'aggregated') {
            const policy = row as PRLPolicy;
            const indicators = [];
            if (policy.hasVoids) indicators.push('VOID');
            if (policy.hasEndorsements) indicators.push('END');
            if (policy.hasCancellations) indicators.push('CAN');
            return escapeCSV(indicators.join(', ') || 'None');
          }
          return escapeCSV('');
        
        default:
          return escapeCSV(value);
      }
    });
    
    lines.push(rowData.join(','));
  });

  // Totals for Aggregated View
  if (viewMode === 'aggregated' && data.length > 0) {
    lines.push('');
    lines.push(escapeCSV('TOTALS'));
    
    const policies = data as PRLPolicy[];
    const totals = {
      transactionCount: policies.reduce((sum, p) => sum + p.transactionCount, 0),
      totalPremium: policies.reduce((sum, p) => sum + p.totalPremium, 0),
      totalAgentComm: policies.reduce((sum, p) => sum + p.totalAgentComm, 0),
      totalPaid: policies.reduce((sum, p) => sum + p.totalPaid, 0),
      balance: policies.reduce((sum, p) => sum + p.balance, 0),
    };

    const totalsRow = visibleColumns.map(col => {
      switch (col.key) {
        case 'policyNumber': return escapeCSV('TOTALS');
        case 'transactionCount': return escapeCSV(totals.transactionCount);
        case 'totalPremium': return escapeCSV(totals.totalPremium.toFixed(2));
        case 'totalAgentComm': return escapeCSV(totals.totalAgentComm.toFixed(2));
        case 'totalPaid': return escapeCSV(totals.totalPaid.toFixed(2));
        case 'balance': return escapeCSV(totals.balance.toFixed(2));
        default: return escapeCSV('');
      }
    });
    
    lines.push(totalsRow.join(','));
  }

  const csvContent = lines.join('\n');
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `prl-report-${viewMode}-${timestamp}.csv`;
  downloadFile(csvContent, filename, 'text/csv');
}

export function printPRLReport(
  data: PRLTransaction[] | PRLPolicy[],
  summary: PRLSummary,
  parameters: ReportParameters,
  columns: ColumnConfig[],
  viewMode: 'aggregated' | 'detailed'
) {
  const visibleColumns = columns.filter(col => col.visible).sort((a, b) => a.order - b.order);
  
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Policy Revenue Ledger Report</title>
      <style>
        @page {
          margin: 0.75in;
          size: landscape;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          font-size: 11px;
          line-height: 1.4;
          color: #333;
          margin: 0;
          padding: 0;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        
        .header h1 {
          margin: 0 0 5px 0;
          font-size: 18px;
          font-weight: bold;
        }
        
        .header p {
          margin: 0;
          color: #666;
        }
        
        .parameters {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
        }
        
        .param-group h3 {
          margin: 0 0 8px 0;
          font-size: 12px;
          font-weight: bold;
          color: #333;
          border-bottom: 1px solid #ddd;
          padding-bottom: 4px;
        }
        
        .param-group p {
          margin: 2px 0;
          font-size: 10px;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .summary-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
          text-align: center;
        }
        
        .summary-card .label {
          font-size: 10px;
          color: #666;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        
        .summary-card .value {
          font-size: 14px;
          font-weight: bold;
          color: #333;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 9px;
        }
        
        th {
          background: #f1f3f4;
          border: 1px solid #ddd;
          padding: 6px 4px;
          text-align: left;
          font-weight: bold;
          font-size: 8px;
          text-transform: uppercase;
        }
        
        td {
          border: 1px solid #ddd;
          padding: 4px;
          vertical-align: top;
        }
        
        tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        .totals-row {
          background: #e9ecef !important;
          font-weight: bold;
          border-top: 2px solid #333;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .negative {
          color: #dc3545;
        }
        
        .indicator {
          display: inline-block;
          padding: 1px 4px;
          border-radius: 3px;
          font-size: 7px;
          font-weight: bold;
        }
        
        .indicator-stmt { background: #cfe2ff; color: #0a58ca; }
        .indicator-void { background: #f8d7da; color: #721c24; }
        .indicator-end { background: #fff3cd; color: #664d03; }
        .indicator-can { background: #f8d7da; color: #721c24; }
        .indicator-other { background: #e9ecef; color: #495057; }
        
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          font-size: 9px;
          color: #666;
          text-align: center;
        }
        
        @media print {
          .no-print { display: none; }
          body { print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Policy Revenue Ledger Report</h1>
        <p>Generated: ${new Date(parameters.reportGenerated).toLocaleString()}</p>
        <p>${parameters.viewMode === 'aggregated' ? 'Aggregated by Policy' : 'Detailed Transactions'} | ${parameters.totalRecords} Records</p>
      </div>

      <div class="parameters">
        <div class="param-group">
          <h3>Report Filters</h3>
          <p><strong>View Mode:</strong> ${parameters.viewMode === 'aggregated' ? 'Aggregated by Policy' : 'Detailed Transactions'}</p>
          <p><strong>Statement Month:</strong> ${parameters.statementMonth ? formatStatementMonth(parameters.statementMonth) : 'All Periods'}</p>
          <p><strong>Balance Filter:</strong> ${parameters.balanceFilter === 'all' ? 'All Balances' : parameters.balanceFilter.charAt(0).toUpperCase() + parameters.balanceFilter.slice(1) + ' Only'}</p>
          <p><strong>Data Aggregation:</strong> ${parameters.dataAggregation}</p>
        </div>
        
        <div class="param-group">
          <h3>Transaction Breakdown</h3>
          <p><strong>STMT:</strong> ${summary.transactionCounts.stmt} statements</p>
          <p><strong>VOID:</strong> ${summary.transactionCounts.void} voided</p>
          <p><strong>END:</strong> ${summary.transactionCounts.end} endorsements</p>
          <p><strong>CAN:</strong> ${summary.transactionCounts.can} cancellations</p>
          <p><strong>OTHER:</strong> ${summary.transactionCounts.other} other</p>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="label">Total Policies</div>
          <div class="value">${summary.totalPolicies.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <div class="label">Total Premium</div>
          <div class="value">${formatCurrency(summary.totalPremium)}</div>
        </div>
        <div class="summary-card">
          <div class="label">Agent Commission</div>
          <div class="value">${formatCurrency(summary.totalAgentComm)}</div>
        </div>
        <div class="summary-card">
          <div class="label">Outstanding Balance</div>
          <div class="value ${summary.totalBalance < 0 ? 'negative' : ''}">${formatCurrency(summary.totalBalance)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            ${visibleColumns.map(col => `<th style="width: ${col.width}px">${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${visibleColumns.map(col => {
                const value = (row as any)[col.key];
                let cellContent = '';
                
                switch (col.key) {
                  case 'effectiveDate':
                  case 'lastStatementMonth':
                    cellContent = value ? formatDate(value) : '';
                    break;
                  case 'statementMonth':
                    cellContent = formatStatementMonth(value || '');
                    break;
                  case 'premiumSold':
                  case 'totalPremium':
                  case 'agencyCommission':
                  case 'totalAgencyComm':
                  case 'agentCommission':
                  case 'totalAgentComm':
                  case 'paidAmount':
                  case 'totalPaid':
                  case 'balance':
                    const numValue = typeof value === 'number' ? value : 0;
                    cellContent = `<div class="text-right ${numValue < 0 ? 'negative' : ''}">${formatCurrency(numValue)}</div>`;
                    break;
                  case 'indicator':
                    if (viewMode === 'detailed') {
                      const indicatorClass = `indicator-${value.toLowerCase()}`;
                      cellContent = `<span class="indicator ${indicatorClass}">${value}</span>`;
                    } else {
                      cellContent = value || '';
                    }
                    break;
                  case 'indicators':
                    if (viewMode === 'aggregated') {
                      const policy = row as PRLPolicy;
                      const indicators = [];
                      if (policy.hasVoids) indicators.push('<span class="indicator indicator-void">VOID</span>');
                      if (policy.hasEndorsements) indicators.push('<span class="indicator indicator-end">END</span>');
                      if (policy.hasCancellations) indicators.push('<span class="indicator indicator-can">CAN</span>');
                      cellContent = indicators.length > 0 ? indicators.join(' ') : '<span class="text-center">—</span>';
                    } else {
                      cellContent = '';
                    }
                    break;
                  default:
                    cellContent = value || '';
                }
                
                return `<td>${cellContent}</td>`;
              }).join('')}
            </tr>
          `).join('')}
          
          ${viewMode === 'aggregated' && data.length > 0 ? `
            <tr class="totals-row">
              ${(() => {
                const policies = data as PRLPolicy[];
                const totals = {
                  transactionCount: policies.reduce((sum, p) => sum + p.transactionCount, 0),
                  totalPremium: policies.reduce((sum, p) => sum + p.totalPremium, 0),
                  totalAgentComm: policies.reduce((sum, p) => sum + p.totalAgentComm, 0),
                  totalPaid: policies.reduce((sum, p) => sum + p.totalPaid, 0),
                  balance: policies.reduce((sum, p) => sum + p.balance, 0),
                };

                return visibleColumns.map(col => {
                  switch (col.key) {
                    case 'policyNumber': return '<td><strong>TOTALS</strong></td>';
                    case 'transactionCount': return `<td class="text-center"><strong>${totals.transactionCount}</strong></td>`;
                    case 'totalPremium': return `<td class="text-right"><strong>${formatCurrency(totals.totalPremium)}</strong></td>`;
                    case 'totalAgentComm': return `<td class="text-right"><strong>${formatCurrency(totals.totalAgentComm)}</strong></td>`;
                    case 'totalPaid': return `<td class="text-right"><strong>${formatCurrency(totals.totalPaid)}</strong></td>`;
                    case 'balance': return `<td class="text-right ${totals.balance < 0 ? 'negative' : ''}"><strong>${formatCurrency(totals.balance)}</strong></td>`;
                    default: return '<td></td>';
                  }
                }).join('');
              })()}
            </tr>
          ` : ''}
        </tbody>
      </table>

      <div class="footer">
        <p>Policy Revenue Ledger Report - Generated ${new Date().toLocaleString()} - ${data.length} records displayed</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}