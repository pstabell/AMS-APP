"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Breadcrumbs from "@/components/Breadcrumbs";
import { TRANSACTION_TYPES, calculateCommission, formatCurrency, formatPercent } from "@/lib/calculations";

type Transaction = {
  id: string;
  customer: string;
  policy_number: string;
  carrier: string;
  mga: string | null;
  line_of_business: string | null;
  premium_sold: number;
  policy_gross_comm_pct: number;
  agency_estimated_comm: number;
  agent_estimated_comm: number;
  agent_paid_amount: number;
  transaction_type: string;
  effective_date: string;
  policy_origination_date: string | null;
  expiration_date: string | null;
  statement_date: string | null;
  invoice_number: string | null;
  notes: string | null;
  reconciliation_status: string | null;
  user_email: string;
  user_id: string;
};

type Props = {
  transactionId: string;
};

export default function SingleTransactionEdit({ transactionId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState<Partial<Transaction>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadTransaction = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/policies?page=1&pageSize=1000`, {
          headers: user?.email ? { "x-user-email": user.email } : {},
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load transaction.");
        }

        const txn = (payload.data ?? []).find((p: Transaction) => String(p.id) === String(transactionId));
        if (txn) {
          setTransaction(txn);
          setFormData(txn);
        } else {
          setError("Transaction not found.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load transaction.");
      }
      setLoading(false);
    };

    loadTransaction();
  }, [transactionId, user?.email]);

  const handleChange = (field: keyof Transaction, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!transaction) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/policies/${transaction.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(user?.email ? { "x-user-email": user.email } : {}),
        },
        body: JSON.stringify(formData),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save transaction.");
      }

      setSuccess("Transaction saved successfully!");
      setTransaction({ ...transaction, ...formData } as Transaction);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save transaction.");
    }
    setSaving(false);
  };

  // Calculate commission preview
  const commissionPreview = formData.premium_sold !== undefined ? calculateCommission({
    premiumSold: Number(formData.premium_sold) || 0,
    policyGrossCommPct: Number(formData.policy_gross_comm_pct) || 0,
    transactionType: formData.transaction_type || "NEW",
    policyOriginationDate: formData.policy_origination_date || null,
    effectiveDate: formData.effective_date || "",
    agentPaidAmount: Number(formData.agent_paid_amount) || 0,
  }) : null;

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard", icon: "🏠" },
    { label: "Edit Transaction", icon: "✏️" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-[var(--foreground-muted)]">Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          ❌ {error}
        </div>
        <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800">
          ← Go back
        </button>
      </div>
    );
  }

  if (!transaction) return null;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
            <span className="text-4xl">✏️</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--foreground)]">Edit Transaction</h1>
            <p className="text-[var(--foreground-muted)] mt-1">
              {transaction.customer} • {transaction.policy_number} • {transaction.transaction_type}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.back()}
          className="text-sm font-semibold text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          ← Back
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          ❌ {error}
        </div>
      )}

      {/* Form Sections */}
      <div className="space-y-6">
        
        {/* Transaction Information */}
        <div className="bg-[var(--background-secondary)] rounded-xl border border-[var(--border-color)] p-6">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <span>📋</span> Transaction Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                Transaction ID
              </label>
              <input
                type="text"
                value={transaction.id}
                disabled
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background-tertiary)] px-3 py-2 text-sm text-[var(--foreground-muted)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                Customer
              </label>
              <input
                type="text"
                value={formData.customer || ""}
                onChange={(e) => handleChange("customer", e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                Transaction Type
              </label>
              <select
                value={formData.transaction_type || ""}
                onChange={(e) => handleChange("transaction_type", e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              >
                {TRANSACTION_TYPES.map(type => (
                  <option key={type.code} value={type.code}>{type.code} - {type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                Line of Business
              </label>
              <input
                type="text"
                value={formData.line_of_business || ""}
                onChange={(e) => handleChange("line_of_business", e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
          </div>
        </div>

        {/* Policy Details */}
        <div className="bg-[var(--background-secondary)] rounded-xl border border-[var(--border-color)] p-6">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <span>📄</span> Policy Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                Policy Number
              </label>
              <input
                type="text"
                value={formData.policy_number || ""}
                onChange={(e) => handleChange("policy_number", e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                Carrier
              </label>
              <input
                type="text"
                value={formData.carrier || ""}
                onChange={(e) => handleChange("carrier", e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                MGA
              </label>
              <input
                type="text"
                value={formData.mga || ""}
                onChange={(e) => handleChange("mga", e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                value={formData.invoice_number || ""}
                onChange={(e) => handleChange("invoice_number", e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-[var(--background-secondary)] rounded-xl border border-[var(--border-color)] p-6">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <span>📅</span> Dates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                Effective Date
              </label>
              <input
                type="date"
                value={formData.effective_date?.split("T")[0] || ""}
                onChange={(e) => handleChange("effective_date", e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                Origination Date
              </label>
              <input
                type="date"
                value={formData.policy_origination_date?.split("T")[0] || ""}
                onChange={(e) => handleChange("policy_origination_date", e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                value={formData.expiration_date?.split("T")[0] || ""}
                onChange={(e) => handleChange("expiration_date", e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                Statement Date
              </label>
              <input
                type="date"
                value={formData.statement_date?.split("T")[0] || ""}
                onChange={(e) => handleChange("statement_date", e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="bg-[var(--background-secondary)] rounded-xl border border-[var(--border-color)] p-6">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <span>💰</span> Financial Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                Premium Sold
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.premium_sold ?? ""}
                onChange={(e) => handleChange("premium_sold", parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                Gross Comm %
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.policy_gross_comm_pct ?? ""}
                onChange={(e) => handleChange("policy_gross_comm_pct", parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                Agent Paid Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.agent_paid_amount ?? ""}
                onChange={(e) => handleChange("agent_paid_amount", parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
                Reconciliation Status
              </label>
              <select
                value={formData.reconciliation_status || "unreconciled"}
                onChange={(e) => handleChange("reconciliation_status", e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              >
                <option value="unreconciled">Unreconciled</option>
                <option value="reconciled">Reconciled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Commission Preview */}
          {commissionPreview && (
            <div className="mt-6 p-4 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border-color)]">
              <h3 className="text-sm font-bold text-[var(--foreground-muted)] mb-3">📊 Commission Preview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-[var(--foreground-muted)]">Agency Comm</p>
                  <p className="font-bold text-indigo-500">{formatCurrency(commissionPreview.agencyCommission)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--foreground-muted)]">Agent Rate</p>
                  <p className="font-bold text-[var(--foreground)]">{formatPercent(commissionPreview.agentRate)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--foreground-muted)]">Agent Comm</p>
                  <p className="font-bold text-amber-500">{formatCurrency(commissionPreview.agentCommission)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--foreground-muted)]">Balance Due</p>
                  <p className={`font-bold ${commissionPreview.balanceDue > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                    {formatCurrency(commissionPreview.balanceDue)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-[var(--background-secondary)] rounded-xl border border-[var(--border-color)] p-6">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <span>📝</span> Notes
          </h2>
          <textarea
            value={formData.notes || ""}
            onChange={(e) => handleChange("notes", e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
            placeholder="Add notes about this transaction..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border border-[var(--border-color)] text-[var(--foreground-muted)] font-semibold hover:bg-[var(--hover-bg)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin">⏳</span>
                Saving...
              </>
            ) : (
              <>
                <span>💾</span>
                Save Transaction
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
