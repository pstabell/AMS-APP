"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return value.split("T")[0];
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${value}%`;
}

// Field display component
function Field({ label, value, className = "" }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={`${className}`}>
      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</dt>
      <dd className="text-sm font-bold text-slate-900">{value || "—"}</dd>
    </div>
  );
}

export default function PolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const policyId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPolicy = async () => {
      if (!policyId) return;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/policies/${policyId}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Policy not found.");
        }

        setPolicy(payload.data);
      } catch (err: any) {
        setError(err.message || "Unable to load policy.");
        setPolicy(null);
      }
      setLoading(false);
    };

    loadPolicy();
  }, [policyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="text-4xl animate-spin inline-block">⏳</span>
          <p className="mt-4 text-slate-600">Loading policy details...</p>
        </div>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <span className="text-4xl">❌</span>
          <p className="mt-4 text-red-800 font-semibold">{error || "Policy not found."}</p>
          <Link
            href="/dashboard/policies"
            className="inline-block mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
          >
            ← Back to policies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
            <span className="text-3xl">📋</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Transaction Details</h1>
            <p className="text-slate-600">Policy #{policy.policy_number}</p>
          </div>
        </div>
        <Link
          href="/dashboard/policies"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-semibold"
        >
          ← Back to All Policies
        </Link>
      </div>

      {/* Customer & Policy Info Card */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl p-6 shadow-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide">Customer</p>
            <p className="text-xl font-bold mt-1">👤 {policy.customer}</p>
          </div>
          <div>
            <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide">Policy Number</p>
            <p className="text-xl font-bold mt-1 font-mono">{policy.policy_number}</p>
          </div>
          <div>
            <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide">Carrier</p>
            <p className="text-xl font-bold mt-1">🏢 {policy.carrier}</p>
          </div>
          <div>
            <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide">Status</p>
            <p className="text-xl font-bold mt-1">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                policy.reconciliation_status === 'reconciled' 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-amber-500 text-white'
              }`}>
                {policy.reconciliation_status === 'reconciled' ? '✓ Reconciled' : '⏳ Pending'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3">
          <h2 className="text-white font-bold flex items-center gap-2">
            <span>💰</span> Financial Summary
          </h2>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-emerald-50 rounded-xl">
            <p className="text-xs text-emerald-600 font-semibold uppercase">Premium Sold</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(policy.premium_sold)}</p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-xl">
            <p className="text-xs text-amber-600 font-semibold uppercase">Commission %</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{formatPercent(policy.policy_gross_comm_pct)}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-600 font-semibold uppercase">Agent Comm $</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{formatCurrency(policy.agency_estimated_comm)}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <p className="text-xs text-purple-600 font-semibold uppercase">Total Agent Comm</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{formatCurrency(policy.total_agent_comm)}</p>
          </div>
        </div>
      </div>

      {/* All Details Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-slate-600 to-slate-500 px-6 py-3">
          <h2 className="text-white font-bold flex items-center gap-2">
            <span>📊</span> All Transaction Details
          </h2>
        </div>
        <div className="p-6">
          {/* Transaction Info */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">📝 Transaction Information</h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Transaction ID" value={policy.transaction_id} />
              <Field label="Client ID" value={policy.client_id} />
              <Field label="Transaction Type" value={
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                  policy.transaction_type === 'NEW' ? 'bg-emerald-100 text-emerald-700' :
                  policy.transaction_type === 'REN' ? 'bg-blue-100 text-blue-700' :
                  policy.transaction_type === 'END' ? 'bg-amber-100 text-amber-700' :
                  policy.transaction_type === 'CAN' ? 'bg-red-100 text-red-700' :
                  policy.transaction_type === 'PMT' ? 'bg-purple-100 text-purple-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {policy.transaction_type}
                </span>
              } />
              <Field label="Policy Type" value={policy.line_of_business} />
            </dl>
          </div>

          {/* Policy Details */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">📁 Policy Details</h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Policy Number" value={policy.policy_number} />
              <Field label="Prior Policy #" value={policy.prior_policy_number} />
              <Field label="Policy Term" value={policy.policy_term ? `${policy.policy_term} months` : "—"} />
              <Field label="Checklist Complete" value={policy.policy_checklist_complete} />
              <Field label="MGA Name" value={policy.mga} />
              <Field label="Carrier" value={policy.carrier} />
            </dl>
          </div>

          {/* Dates */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">📅 Dates</h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Effective Date" value={formatDate(policy.effective_date)} />
              <Field label="Origination Date" value={formatDate(policy.policy_origination_date)} />
              <Field label="Expiration Date" value={formatDate(policy.expiration_date)} />
              <Field label="Statement Date" value={formatDate(policy.statement_date)} />
            </dl>
          </div>

          {/* Financial Details */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">💰 Financial Details</h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Premium Sold" value={formatCurrency(policy.premium_sold)} />
              <Field label="Policy Gross Comm %" value={formatPercent(policy.policy_gross_comm_pct)} />
              <Field label="Agent Comm %" value={formatPercent(policy.agent_comm_pct)} />
              <Field label="Agent Estimated Comm $" value={formatCurrency(policy.agency_estimated_comm)} />
              <Field label="Broker Fee" value={formatCurrency(policy.broker_fee)} />
              <Field label="Policy Taxes & Fees" value={formatCurrency(policy.policy_taxes_fees)} />
              <Field label="Commissionable Premium" value={policy.commissionable_premium ? formatCurrency(Number(policy.commissionable_premium)) : "—"} />
              <Field label="Broker Fee Agent Comm" value={formatCurrency(policy.broker_fee_agent_comm)} />
              <Field label="Total Agent Comm" value={formatCurrency(policy.total_agent_comm)} />
              <Field label="Agent Paid Amount" value={policy.agent_paid_amount ? formatCurrency(Number(policy.agent_paid_amount)) : "—"} />
              <Field label="Agency Comm Received" value={policy.agency_comm_received ? formatCurrency(Number(policy.agency_comm_received)) : "—"} />
              <Field label="Agency Est. Revenue (CRM)" value={policy.agency_estimated_revenue ? formatCurrency(Number(policy.agency_estimated_revenue)) : "—"} />
            </dl>
          </div>

          {/* Reconciliation */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">🔄 Reconciliation</h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Status" value={
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                  policy.reconciliation_status === 'reconciled' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {policy.reconciliation_status || 'unreconciled'}
                </span>
              } />
              <Field label="Reconciliation ID" value={policy.reconciliation_id} />
              <Field label="Reconciled At" value={formatDate(policy.reconciled_at)} />
              <Field label="Is Reconciliation Entry" value={policy.is_reconciliation_entry ? "Yes" : "No"} />
            </dl>
          </div>

          {/* Notes */}
          {policy.notes && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">📝 Notes</h3>
              <p className="text-slate-700 bg-slate-50 p-4 rounded-lg">{policy.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">⚙️ Metadata</h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Record ID" value={policy.id} />
              <Field label="User Email" value={policy.user_email} />
              <Field label="User ID" value={policy.user_id} />
              <Field label="Last Updated" value={formatDate(policy.updated_at)} />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
