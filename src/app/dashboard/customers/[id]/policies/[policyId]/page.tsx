"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { PolicyTerm } from "@/lib/customers";
import type { Policy } from "@/lib/policies";
import { decodeCustomerId } from "@/lib/customers";
import { calculateCommission, formatCurrency, formatPercent } from "@/lib/calculations";

function formatDate(value: string | null) {
  if (!value) return "—";
  return value.split("T")[0];
}

function getTransactionTypeColor(type: string) {
  switch (type) {
    case "NEW":
    case "NBS":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "RWL":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "END":
    case "PCH":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "CAN":
    case "XCL":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "STL":
    case "BoR":
      return "bg-purple-100 text-purple-700 border-purple-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getTransactionTypeDescription(type: string) {
  switch (type) {
    case "NEW":
    case "NBS":
      return "New Business";
    case "RWL":
      return "Renewal";
    case "END":
      return "Endorsement";
    case "PCH":
      return "Policy Change";
    case "CAN":
    case "XCL":
      return "Cancellation";
    case "STL":
      return "Settlement";
    case "BoR":
      return "Broker of Record";
    default:
      return type;
  }
}

export default function PolicyTermPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const customerId = params.id as string;
  const policyId = params.policyId as string;
  const customerName = decodeCustomerId(customerId);
  const policyNumber = decodeURIComponent(policyId);

  const [policyTerm, setPolicyTerm] = useState<PolicyTerm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);

  useEffect(() => {
    const loadPolicyTerm = async () => {
      if (!user?.email) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/customers/${customerId}/policies/${policyId}`, {
          headers: {
            "x-user-email": user.email,
          },
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load policy term.");
        }

        setPolicyTerm(payload.policyTerm);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load policy term.";
        setError(message);
      }
      setLoading(false);
    };

    loadPolicyTerm();
  }, [user?.email, customerId, policyId]);

  // Calculate commission for each transaction
  const transactionsWithCalcs = useMemo(() => {
    if (!policyTerm?.transactions) return [];
    
    return policyTerm.transactions.map((txn) => {
      const calc = calculateCommission({
        premiumSold: Number(txn.premium_sold) || 0,
        policyGrossCommPct: Number(txn.policy_gross_comm_pct) || 0,
        transactionType: txn.transaction_type,
        policyOriginationDate: txn.policy_origination_date,
        effectiveDate: txn.effective_date,
        agentPaidAmount: Number(txn.agent_paid_amount) || 0,
      });
      return { ...txn, calc };
    });
  }, [policyTerm?.transactions]);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard", icon: "🏠" },
    { label: "Customers", href: "/dashboard/customers", icon: "👥" },
    { label: customerName, href: `/dashboard/customers/${customerId}`, icon: "👤" },
    { label: policyNumber, icon: "📄" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-slate-600">Loading policy term...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          ❌ {error}
        </div>
        <Link href={`/dashboard/customers/${customerId}`} className="text-blue-600 hover:text-blue-800">
          ← Back to customer
        </Link>
      </div>
    );
  }

  if (!policyTerm) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">📄</span>
          <p className="text-slate-600">Policy term not found.</p>
          <Link href={`/dashboard/customers/${customerId}`} className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Back to customer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <span className="text-4xl">📄</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--foreground)] font-mono">{policyNumber}</h1>
            <p className="text-[var(--foreground-muted)] mt-1">
              <Link href={`/dashboard/customers/${customerId}`} className="hover:text-blue-600 transition-colors">
                {customerName}
              </Link>
              <span className="mx-2">•</span>
              {policyTerm.carrier}
              {policyTerm.lineOfBusiness && (
                <>
                  <span className="mx-2">•</span>
                  {policyTerm.lineOfBusiness}
                </>
              )}
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/customers/${customerId}`}
          className="text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          ← Back to {customerName}
        </Link>
      </div>

      {/* Summary Cards - Icon+Title on top, Number below */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-indigo-100">
              <span className="text-lg">📝</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Transactions</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{policyTerm.transactionCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-100">
              <span className="text-lg">💰</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Premium</p>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{formatCurrency(policyTerm.totalPremium)}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-100">
              <span className="text-lg">💎</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Agent Comm</p>
          </div>
          <p className="text-3xl font-bold text-amber-600">{formatCurrency(policyTerm.totalAgentComm)}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-green-100">
              <span className="text-lg">✅</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Paid</p>
          </div>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(policyTerm.totalPaid)}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${policyTerm.balanceDue > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
              <span className="text-lg">{policyTerm.balanceDue > 0 ? '⏳' : '✅'}</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Balance Due</p>
          </div>
          <p className={`text-3xl font-bold ${policyTerm.balanceDue > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
            {formatCurrency(policyTerm.balanceDue)}
          </p>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>📋</span> Policy Transactions
          </h2>
          <Link
            href="/dashboard/policies/new"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <span>➕</span> Add Transaction
          </Link>
        </div>

        {/* Explanation Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-start gap-3 text-sm">
            <span className="text-amber-600 font-semibold shrink-0">💡 Transactions:</span>
            <span className="text-slate-700">
              Each row represents a liability or credit against this policy term. Transaction types determine commission rates:
              NEW/NBS = 50% | RWL = 25% | END/PCH = 50%/25% | CAN = 0%.
            </span>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-indigo-100 to-purple-100 border-b-2 border-indigo-300">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-800">📅 Effective Date</th>
                  <th className="px-4 py-3 font-bold text-slate-800">🏷️ Type</th>
                  <th className="px-4 py-3 font-bold text-slate-800 text-right">💰 Premium</th>
                  <th className="px-4 py-3 font-bold text-slate-800 text-right">📊 Gross %</th>
                  <th className="px-4 py-3 font-bold text-slate-800 text-right">🏢 Agency Comm</th>
                  <th className="px-4 py-3 font-bold text-slate-800 text-right">📈 Rate</th>
                  <th className="px-4 py-3 font-bold text-slate-800 text-right">💎 Agent Comm</th>
                  <th className="px-4 py-3 font-bold text-slate-800 text-right">✅ Paid</th>
                  <th className="px-4 py-3 font-bold text-slate-800 text-right">⏳ Balance</th>
                  <th className="px-4 py-3 font-bold text-slate-800 text-center">⚡</th>
                </tr>
              </thead>
              <tbody>
                {transactionsWithCalcs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={10}>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">📋</span>
                        <span>No transactions found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactionsWithCalcs.map((txn) => (
                    <>
                      <tr
                        key={txn.id}
                        className={`border-b border-slate-100 hover:bg-indigo-50 transition-colors cursor-pointer ${
                          expandedTransactionId === txn.id ? 'bg-indigo-50' : ''
                        }`}
                        onClick={() => setExpandedTransactionId(expandedTransactionId === txn.id ? null : txn.id)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">
                            {formatDate(txn.effective_date)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${getTransactionTypeColor(txn.transaction_type)}`}>
                            {txn.transaction_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${Number(txn.premium_sold) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {formatCurrency(Number(txn.premium_sold) || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-slate-600">
                            {Number(txn.policy_gross_comm_pct) || 0}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-indigo-600 font-medium">
                            {formatCurrency(txn.calc.agencyCommission)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-slate-600">
                            {formatPercent(txn.calc.agentRate)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-amber-600">
                            {formatCurrency(txn.calc.agentCommission)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-green-600">
                            {formatCurrency(Number(txn.agent_paid_amount) || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${txn.calc.balanceDue > 0 ? 'text-amber-600' : txn.calc.balanceDue < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                            {formatCurrency(txn.calc.balanceDue)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            href={`/dashboard/policies/edit?id=${txn.id}`}
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                      {/* Expanded Details Row */}
                      {expandedTransactionId === txn.id && (
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <td colSpan={10} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Transaction Type</p>
                                <p className="text-slate-900">{getTransactionTypeDescription(txn.transaction_type)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Policy Origination</p>
                                <p className="text-slate-900">{formatDate(txn.policy_origination_date)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Statement Date</p>
                                <p className="text-slate-900">{formatDate(txn.statement_date)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Invoice #</p>
                                <p className="text-slate-900">{txn.invoice_number || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-slate-500 mb-1">MGA</p>
                                <p className="text-slate-900">{txn.mga || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Expiration Date</p>
                                <p className="text-slate-900">{formatDate(txn.expiration_date)}</p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Notes</p>
                                <p className="text-slate-900">{txn.notes || "No notes"}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
              {/* Summary Footer */}
              <tfoot className="bg-gradient-to-r from-slate-100 to-slate-200 border-t-2 border-slate-300">
                <tr>
                  <td className="px-4 py-3 font-bold text-slate-800" colSpan={2}>
                    Totals ({transactionsWithCalcs.length} transactions)
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700">
                    {formatCurrency(policyTerm.totalPremium)}
                  </td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-700">
                    {formatCurrency(policyTerm.totalAgencyComm)}
                  </td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right font-bold text-amber-700">
                    {formatCurrency(policyTerm.totalAgentComm)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-700">
                    {formatCurrency(policyTerm.totalPaid)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-amber-700">
                    {formatCurrency(policyTerm.balanceDue)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Policy Term Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span>📅</span> Policy Timeline
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-slate-600">First Transaction:</span>
            <span className="font-medium text-slate-900">{formatDate(policyTerm.earliestEffectiveDate)}</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 via-blue-200 to-indigo-200"></div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Latest Transaction:</span>
            <span className="font-medium text-slate-900">{formatDate(policyTerm.latestEffectiveDate)}</span>
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
