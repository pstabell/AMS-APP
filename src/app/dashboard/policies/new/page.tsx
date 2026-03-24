"use client";

// Force this page to be dynamic and skip prerendering
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { TRANSACTION_TYPES, calculateCommission, formatCurrency, formatPercent } from "@/lib/calculations";
import { getCarriers, type Carrier } from "@/lib/carriers";
import { getMGAs, type MGA } from "@/lib/mgas";

const demoEmail = "demo@agentcommissiontracker.com";

export default function NewPolicyPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Form fields
  const [customer, setCustomer] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [mga, setMGA] = useState("");
  const [lineOfBusiness, setLineOfBusiness] = useState("");
  const [premiumSold, setPremiumSold] = useState("");
  const [policyGrossCommPct, setPolicyGrossCommPct] = useState("");
  const [transactionType, setTransactionType] = useState("NEW");
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [policyOriginationDate, setPolicyOriginationDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [statementDate, setStatementDate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [agentPaidAmount, setAgentPaidAmount] = useState("");
  const [notes, setNotes] = useState("");
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Dropdown data
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [mgas, setMGAs] = useState<MGA[]>([]);
  const [carriersError, setCarriersError] = useState<string | null>(null);
  const [mgasError, setMGAsError] = useState<string | null>(null);

  // Load carriers and MGAs on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load from API endpoints that work with demo user
        const [carriersRes, mgasRes] = await Promise.all([
          fetch("/api/policies/carriers", {
            headers: user?.email ? { "x-user-email": user.email } : {},
          }),
          fetch("/api/policies/mgas", {
            headers: user?.email ? { "x-user-email": user.email } : {},
          }),
        ]);

        if (carriersRes.ok) {
          const carriersData = await carriersRes.json();
          // Convert string array to Carrier-like objects for dropdown
          setCarriers((carriersData.data || []).map((name: string) => ({ 
            id: name, 
            name, 
            code: name 
          })));
        }

        if (mgasRes.ok) {
          const mgasData = await mgasRes.json();
          // Convert string array to MGA-like objects for dropdown
          setMGAs((mgasData.data || []).map((name: string) => ({ 
            id: name, 
            name, 
            code: name 
          })));
        }
      } catch (err) {
        console.error("Error loading carriers/MGAs:", err);
        // Don't show error - just proceed without dropdowns populated
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.email]);

  // Real-time commission calculation
  const commissionCalculation = useMemo(() => {
    const premium = Number(premiumSold);
    const grossPct = Number(policyGrossCommPct);
    
    if (!premium || !grossPct) {
      return {
        agencyCommission: 0,
        agentRate: 0,
        agentCommission: 0,
        balanceDue: 0,
      };
    }

    return calculateCommission({
      premiumSold: premium,
      policyGrossCommPct: grossPct,
      transactionType,
      policyOriginationDate,
      effectiveDate,
      agentPaidAmount: Number(agentPaidAmount) || 0,
    });
  }, [premiumSold, policyGrossCommPct, transactionType, policyOriginationDate, effectiveDate, agentPaidAmount]);

  const inputClass = (hasError?: boolean) =>
    [
      "w-full rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2",
      hasError
        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
        : "border-slate-200 focus:border-slate-400 focus:ring-slate-200",
    ].join(" ");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const nextErrors: Record<string, string> = {};

    // Required field validation
    if (!customer.trim()) {
      nextErrors.customer = "Customer name is required.";
    }
    if (!policyNumber.trim()) {
      nextErrors.policyNumber = "Policy number is required.";
    }
    if (!carrier.trim()) {
      nextErrors.carrier = "Carrier is required.";
    }
    if (!effectiveDate) {
      nextErrors.effectiveDate = "Effective date is required.";
    }

    // Numeric field validation
    const premium = Number(premiumSold);
    const grossPct = Number(policyGrossCommPct);
    const paidAmount = Number(agentPaidAmount);

    if (!premiumSold || Number.isNaN(premium) || premium < 0) {
      nextErrors.premiumSold = "Enter a valid premium amount.";
    }
    if (!policyGrossCommPct || Number.isNaN(grossPct) || grossPct < 0 || grossPct > 100) {
      nextErrors.policyGrossCommPct = "Enter a valid commission percentage (0-100).";
    }
    if (agentPaidAmount && (Number.isNaN(paidAmount) || paidAmount < 0)) {
      nextErrors.agentPaidAmount = "Enter a valid paid amount.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customer: customer.trim(),
        policy_number: policyNumber.trim(),
        carrier: carrier.trim(),
        mga: mga.trim() || null,
        line_of_business: lineOfBusiness.trim() || null,
        premium_sold: premium,
        policy_gross_comm_pct: grossPct,
        agency_estimated_comm: commissionCalculation.agencyCommission,
        agent_estimated_comm: commissionCalculation.agentCommission,
        agent_paid_amount: paidAmount || null,
        transaction_type: transactionType,
        effective_date: effectiveDate,
        policy_origination_date: policyOriginationDate || null,
        expiration_date: expirationDate || null,
        statement_date: statementDate || null,
        invoice_number: invoiceNumber.trim() || null,
        notes: notes.trim() || null,
        user_email: user?.email || demoEmail,
        user_id: user?.id || null,
      };

      const response = await fetch("/api/policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Unable to save policy.");
      }

      router.push("/dashboard/policies");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save policy.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto"></div>
          <p className="text-sm text-[var(--foreground-muted)]">Loading carriers and MGAs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">Add New Policy ➕</h2>
          <p className="text-sm text-[var(--foreground-muted)]">Capture a new commission transaction with real-time calculations.</p>
        </div>
        <Link
          href="/dashboard/policies"
          className="text-sm font-semibold text-[var(--foreground)] hover:text-[var(--accent-primary)]"
        >
          Back to policies
        </Link>
      </div>

      {error && (
        <div className="rounded-[var(--border-radius-large)] border border-[var(--error-red)] bg-[var(--error-red)] px-4 py-3 text-sm text-white">
          {error}
        </div>
      )}

      {(carriersError || mgasError) && (
        <div className="rounded-[var(--border-radius-large)] border border-[var(--accent-secondary)] bg-[var(--accent-secondary)] px-4 py-3 text-sm text-white">
          Warning: {carriersError || mgasError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card space-y-6 rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] p-6 shadow-lg">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-2">
                Basic Information
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="customer">
                    Insured Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="customer"
                    type="text"
                    className={inputClass(!!fieldErrors.customer)}
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    placeholder="Enter the insured's name"
                    required
                  />
                  {fieldErrors.customer && (
                    <p className="text-xs text-rose-600">{fieldErrors.customer}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="policyNumber">
                    Policy Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="policyNumber"
                    type="text"
                    className={inputClass(!!fieldErrors.policyNumber)}
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    placeholder="POL-123456"
                    required
                  />
                  {fieldErrors.policyNumber && (
                    <p className="text-xs text-rose-600">{fieldErrors.policyNumber}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="lineOfBusiness">
                    Line of Business
                  </label>
                  <input
                    id="lineOfBusiness"
                    type="text"
                    className={inputClass()}
                    value={lineOfBusiness}
                    onChange={(e) => setLineOfBusiness(e.target.value)}
                    placeholder="Auto, Property, etc."
                  />
                </div>
              </div>
            </div>

            {/* Carrier & MGA */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-2">
                Carrier & MGA
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="carrier">
                    Carrier <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="carrier"
                    className={inputClass(!!fieldErrors.carrier)}
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    required
                  >
                    <option value="">Select a carrier</option>
                    {carriers.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} {c.code && `(${c.code})`}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.carrier && (
                    <p className="text-xs text-rose-600">{fieldErrors.carrier}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="mga">
                    MGA
                  </label>
                  <select
                    id="mga"
                    className={inputClass()}
                    value={mga}
                    onChange={(e) => setMGA(e.target.value)}
                  >
                    <option value="">Select an MGA (optional)</option>
                    {mgas.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-2">
                Transaction Details
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="transactionType">
                    Transaction Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="transactionType"
                    className={inputClass()}
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                    required
                  >
                    {TRANSACTION_TYPES.map((type) => (
                      <option key={type.code} value={type.code}>
                        {type.code} - {type.description}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">
                    Current rate: {formatPercent(commissionCalculation.agentRate)}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="effectiveDate">
                    Effective Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="effectiveDate"
                    type="date"
                    className={inputClass(!!fieldErrors.effectiveDate)}
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    required
                  />
                  {fieldErrors.effectiveDate && (
                    <p className="text-xs text-rose-600">{fieldErrors.effectiveDate}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="policyOriginationDate">
                    Policy Origination Date
                  </label>
                  <input
                    id="policyOriginationDate"
                    type="date"
                    className={inputClass()}
                    value={policyOriginationDate}
                    onChange={(e) => setPolicyOriginationDate(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    For END/PCH: affects commission rate calculation
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="expirationDate">
                    Expiration Date
                  </label>
                  <input
                    id="expirationDate"
                    type="date"
                    className={inputClass()}
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-2">
                Financial Details
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="premiumSold">
                    Premium Sold <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="premiumSold"
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputClass(!!fieldErrors.premiumSold)}
                    value={premiumSold}
                    onChange={(e) => setPremiumSold(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                  {fieldErrors.premiumSold && (
                    <p className="text-xs text-rose-600">{fieldErrors.premiumSold}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="policyGrossCommPct">
                    Policy Gross Commission % <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="policyGrossCommPct"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className={inputClass(!!fieldErrors.policyGrossCommPct)}
                    value={policyGrossCommPct}
                    onChange={(e) => setPolicyGrossCommPct(e.target.value)}
                    placeholder="15.00"
                    required
                  />
                  {fieldErrors.policyGrossCommPct && (
                    <p className="text-xs text-rose-600">{fieldErrors.policyGrossCommPct}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="agentPaidAmount">
                    Agent Paid Amount
                  </label>
                  <input
                    id="agentPaidAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputClass(!!fieldErrors.agentPaidAmount)}
                    value={agentPaidAmount}
                    onChange={(e) => setAgentPaidAmount(e.target.value)}
                    placeholder="0.00"
                  />
                  {fieldErrors.agentPaidAmount && (
                    <p className="text-xs text-rose-600">{fieldErrors.agentPaidAmount}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-2">
                Additional Information
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="statementDate">
                    Statement Date
                  </label>
                  <input
                    id="statementDate"
                    type="date"
                    className={inputClass()}
                    value={statementDate}
                    onChange={(e) => setStatementDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="invoiceNumber">
                    Invoice Number
                  </label>
                  <input
                    id="invoiceNumber"
                    type="text"
                    className={inputClass()}
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-123456"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="notes">
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  className={inputClass()}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about the policy transaction..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Link
                href="/dashboard/policies"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Policy"}
              </button>
            </div>
          </form>
        </div>

        {/* Real-time Commission Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <div className="card rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] p-6 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-secondary-hover)] shadow-md">
                  <span className="text-xl">💰</span>
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)]">Commission Preview</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground-muted)]">Premium Sold:</span>
                  <span className="font-medium text-[var(--foreground)]">{formatCurrency(Number(premiumSold) || 0)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground-muted)]">Gross Commission %:</span>
                  <span className="font-medium text-[var(--foreground)]">{Number(policyGrossCommPct) || 0}%</span>
                </div>
                
                <div className="flex justify-between text-sm border-t border-[var(--border-color)] pt-3">
                  <span className="text-[var(--foreground-muted)]">Agency Commission:</span>
                  <span className="font-medium text-[var(--accent-primary)]">{formatCurrency(commissionCalculation.agencyCommission)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground-muted)]">Agent Rate:</span>
                  <span className="font-medium text-[var(--foreground)]">{formatPercent(commissionCalculation.agentRate)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground-muted)]">Agent Commission:</span>
                  <span className="font-medium text-[var(--success-green)]">{formatCurrency(commissionCalculation.agentCommission)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground-muted)]">Paid Amount:</span>
                  <span className="font-medium text-[var(--foreground)]">{formatCurrency(Number(agentPaidAmount) || 0)}</span>
                </div>
                
                <div className="flex justify-between text-sm border-t border-[var(--border-color)] pt-3">
                  <span className="text-[var(--foreground-muted)]">Balance Due:</span>
                  <span className={`font-semibold ${commissionCalculation.balanceDue >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                    {formatCurrency(commissionCalculation.balanceDue)}
                  </span>
                </div>
              </div>
              
              {transactionType === 'END' || transactionType === 'PCH' ? (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700">
                    <strong>Rate Info:</strong> {policyOriginationDate && effectiveDate && 
                    policyOriginationDate.split('T')[0] === effectiveDate.split('T')[0] 
                      ? "50% rate (new business - dates match)" 
                      : "25% rate (renewal business - dates differ)"}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="card rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background)] p-4">
              <h4 className="font-medium text-[var(--foreground)] mb-2">Transaction Types</h4>
              <div className="space-y-1 text-xs text-[var(--foreground-muted)]">
                <div><strong>NEW/NBS:</strong> 50%</div>
                <div><strong>RWL:</strong> 25%</div>
                <div><strong>END/PCH:</strong> 50% if new, 25% if renewal</div>
                <div><strong>STL/BoR:</strong> 50%</div>
                <div><strong>CAN/XCL:</strong> 0%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Footer */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--background)] px-4 py-4 mt-8">
        <div className="mx-auto max-w-md text-center text-xs text-[var(--foreground-muted)]">
          <div className="flex items-center justify-center gap-2">
            <a href="/terms" className="hover:text-[var(--foreground)]">Terms of Service</a>
            <span>·</span>
            <a href="/privacy" className="hover:text-[var(--foreground)]">Privacy Policy</a>
          </div>
          <p className="mt-2">© 2025 Metro Point Technology LLC. All rights reserved.</p>
          <p className="mt-1">Agent Management System™ is a product of Metro Point Technology LLC.</p>
        </div>
      </footer>
    </div>
  );
}
