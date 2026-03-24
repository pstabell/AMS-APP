"use client";

// Force this page to be dynamic and skip prerendering
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import type { Policy } from "@/lib/policies";
import { TRANSACTION_TYPES, calculateCommission, formatCurrency, formatPercent } from "@/lib/calculations";
import { getCarriers, type Carrier } from "@/lib/carriers";
import { getMGAs, type MGA } from "@/lib/mgas";

type EditableDraft = {
  customer?: string;
  policy_number?: string;
  carrier?: string;
  mga?: string;
  line_of_business?: string;
  premium_sold?: string;
  policy_gross_comm_pct?: string;
  agency_estimated_comm?: string;
  agent_estimated_comm?: string;
  agent_paid_amount?: string;
  effective_date?: string;
  policy_origination_date?: string;
  expiration_date?: string;
  statement_date?: string;
  invoice_number?: string;
  transaction_type?: string;
  notes?: string;
};

const PAGE_SIZE = 1000;

function formatDate(value: string) {
  if (!value) return "";
  return value.split("T")[0];
}

function formatNumberInput(value: number | null | undefined) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function toNumber(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function EditPoliciesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Main state
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [drafts, setDrafts] = useState<Record<string, EditableDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string | null>>({});
  const [rowSuccess, setRowSuccess] = useState<Record<string, string | null>>({});
  
  // Lookup state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState<"list" | "lookup">("list");
  
  // Dropdown data
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [mgas, setMGAs] = useState<MGA[]>([]);
  
  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setGlobalError(null);

      try {
        // Check if there's a specific policy ID in search params
        const policyId = searchParams.get('id');
        
        // Load policies and reference data
        const [policiesResponse, carriersResult, mgasResult] = await Promise.all([
          fetch(`/api/policies?page=1&pageSize=${PAGE_SIZE}`),
          user?.id ? getCarriers(user.id) : Promise.resolve({ data: [], error: null }),
          user?.id ? getMGAs(user.id) : Promise.resolve({ data: [], error: null }),
        ]);

        const policiesPayload = await policiesResponse.json();

        if (!policiesResponse.ok) {
          throw new Error(policiesPayload?.error || "Unable to load policies.");
        }

        setPolicies(policiesPayload.data ?? []);
        setCarriers(carriersResult.data);
        setMGAs(mgasResult.data);

        // If policy ID specified, find and select it
        if (policyId) {
          const policy = (policiesPayload.data ?? []).find((p: Policy) => p.id === policyId);
          if (policy) {
            setSelectedPolicy(policy);
            setSearchMode("lookup");
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to load data.";
        setGlobalError(message);
        setPolicies([]);
      }

      setLoading(false);
    };

    loadData();
  }, [searchParams, user?.id]);

  const editedCount = useMemo(
    () => Object.keys(drafts).length,
    [drafts]
  );

  // Policy lookup functionality
  const handlePolicyLookup = async () => {
    if (!searchTerm.trim()) return;

    const policy = policies.find(
      p => 
        p.id === searchTerm ||
        p.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (policy) {
      setSelectedPolicy(policy);
      setSearchMode("lookup");
      setGlobalError(null);
    } else {
      setGlobalError("Policy not found. Try searching by policy number, customer name, or policy ID.");
    }
  };

  // Commission recalculation for a policy
  const getRecalculatedCommission = (policy: Policy, draft?: EditableDraft) => {
    const premiumSold = Number(draft?.premium_sold ?? policy.premium_sold);
    const grossPct = Number(draft?.policy_gross_comm_pct ?? policy.policy_gross_comm_pct);
    const transactionType = draft?.transaction_type ?? policy.transaction_type;
    const policyOriginationDate = draft?.policy_origination_date ?? policy.policy_origination_date;
    const effectiveDate = draft?.effective_date ?? policy.effective_date;
    const agentPaidAmount = Number(draft?.agent_paid_amount ?? policy.agent_paid_amount ?? 0);

    return calculateCommission({
      premiumSold,
      policyGrossCommPct: grossPct,
      transactionType,
      policyOriginationDate,
      effectiveDate,
      agentPaidAmount,
    });
  };

  const updateDraft = (
    id: string,
    field: keyof EditableDraft,
    value: string
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
    setRowError((prev) => ({ ...prev, [id]: null }));
    setRowSuccess((prev) => ({ ...prev, [id]: null }));
  };

  const getDraftValue = (
    policy: Policy,
    field: keyof EditableDraft
  ): string => {
    const draft = drafts[policy.id];
    if (draft && draft[field] !== undefined) {
      return draft[field] ?? "";
    }

    switch (field) {
      case "customer":
        return policy.customer ?? "";
      case "policy_number":
        return policy.policy_number ?? "";
      case "carrier":
        return policy.carrier ?? "";
      case "mga":
        return policy.mga ?? "";
      case "line_of_business":
        return policy.line_of_business ?? "";
      case "premium_sold":
        return formatNumberInput(policy.premium_sold);
      case "policy_gross_comm_pct":
        return formatNumberInput(policy.policy_gross_comm_pct);
      case "agent_paid_amount":
        return formatNumberInput(policy.agent_paid_amount ?? 0);
      case "effective_date":
        return formatDate(policy.effective_date);
      case "policy_origination_date":
        return formatDate(policy.policy_origination_date ?? "");
      case "expiration_date":
        return formatDate(policy.expiration_date ?? "");
      case "statement_date":
        return formatDate(policy.statement_date ?? "");
      case "invoice_number":
        return policy.invoice_number ?? "";
      case "transaction_type":
        return policy.transaction_type ?? "";
      case "notes":
        return policy.notes ?? "";
      default:
        return "";
    }
  };

  const buildPayload = (policy: Policy) => {
    const draft = drafts[policy.id];
    if (!draft) return null;

    const payload: Record<string, unknown> = {};
    let hasChanges = false;

    // Text fields
    const textFields = ['customer', 'policy_number', 'carrier', 'mga', 'line_of_business', 'invoice_number', 'notes'] as const;
    for (const field of textFields) {
      if (draft[field] !== undefined && draft[field] !== policy[field]) {
        payload[field] = draft[field]?.trim() || null;
        hasChanges = true;
      }
    }

    // Date fields
    const dateFields = ['effective_date', 'policy_origination_date', 'expiration_date', 'statement_date'] as const;
    for (const field of dateFields) {
      if (draft[field] !== undefined) {
        const currentDate = formatDate(policy[field] ?? "");
        if (draft[field] !== currentDate) {
          payload[field] = draft[field] || null;
          hasChanges = true;
        }
      }
    }

    // Transaction type
    if (draft.transaction_type !== undefined) {
      const nextType = draft.transaction_type.trim().toUpperCase();
      if (nextType && nextType !== policy.transaction_type) {
        payload.transaction_type = nextType;
        hasChanges = true;
      }
    }

    // Numeric fields with validation
    const numericFields = [
      { field: 'premium_sold', label: 'Premium' },
      { field: 'policy_gross_comm_pct', label: 'Gross Commission %' },
      { field: 'agent_paid_amount', label: 'Paid Amount' },
    ] as const;

    for (const { field, label } of numericFields) {
      if (draft[field] !== undefined) {
        const parsed = toNumber(draft[field]);
        if (parsed === null && draft[field]?.trim()) {
          return { error: `${label} must be a valid number.` };
        }
        if (parsed !== Number(policy[field])) {
          payload[field] = parsed;
          hasChanges = true;
        }
      }
    }

    if (!hasChanges) {
      return { error: "No changes to save." };
    }

    // Recalculate commissions if financial fields changed
    if (payload.premium_sold !== undefined || payload.policy_gross_comm_pct !== undefined || 
        payload.transaction_type !== undefined || payload.effective_date !== undefined ||
        payload.policy_origination_date !== undefined) {
      
      const recalc = getRecalculatedCommission(policy, draft);
      payload.agency_estimated_comm = recalc.agencyCommission;
      payload.agent_estimated_comm = recalc.agentCommission;
    }

    return { payload };
  };

  const handleSave = async (policy: Policy) => {
    setRowError((prev) => ({ ...prev, [policy.id]: null }));
    setRowSuccess((prev) => ({ ...prev, [policy.id]: null }));

    const result = buildPayload(policy);
    if (!result || "error" in result) {
      setRowError((prev) => ({
        ...prev,
        [policy.id]: result?.error ?? "No changes to save.",
      }));
      return;
    }

    setSavingIds((prev) => new Set(prev).add(policy.id));

    try {
      const response = await fetch(`/api/policies/${policy.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.payload),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save policy.");
      }

      const updatedPolicy = payload.data;
      setPolicies((prev) =>
        prev.map((row) => (row.id === policy.id ? updatedPolicy : row))
      );
      
      if (selectedPolicy?.id === policy.id) {
        setSelectedPolicy(updatedPolicy);
      }
      
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[policy.id];
        return next;
      });
      setRowSuccess((prev) => ({
        ...prev,
        [policy.id]: "Saved successfully",
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save policy.";
      setRowError((prev) => ({ ...prev, [policy.id]: message }));
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(policy.id);
        return next;
      });
    }
  };

  const handleDelete = async (policy: Policy) => {
    if (!user?.email) return;

    setSavingIds((prev) => new Set(prev).add(policy.id));
    setRowError((prev) => ({ ...prev, [policy.id]: null }));

    try {
      const response = await fetch(`/api/policies/${policy.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error || "Unable to delete policy.");
      }

      setPolicies((prev) => prev.filter((row) => row.id !== policy.id));
      
      if (selectedPolicy?.id === policy.id) {
        setSelectedPolicy(null);
        setSearchMode("list");
      }
      
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[policy.id];
        return next;
      });
      setDeleteConfirmId(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete policy.";
      setRowError((prev) => ({ ...prev, [policy.id]: message }));
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(policy.id);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto"></div>
          <p className="text-sm text-[var(--foreground-muted)]">Loading policies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">
            ✏️ Edit Policy Transactions
          </h2>
          <p className="text-sm text-[var(--foreground-muted)]">
            Search for and edit commission transactions with real-time commission recalculation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-[var(--foreground-muted)]">
            {editedCount ? `${editedCount} rows with edits` : "No edits yet"}
          </div>
          <Link
            href="/dashboard/policies"
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            Back to policies
          </Link>
        </div>
      </div>

      {/* Global Error */}
      {globalError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {globalError}
        </div>
      )}

      {/* Search/Mode Toggle */}
      <div className="card rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] p-4 shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSearchMode("list")}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                searchMode === "list"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setSearchMode("lookup")}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                searchMode === "lookup"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Policy Lookup
            </button>
          </div>
          
          {searchMode === "lookup" && (
            <div className="flex gap-2 flex-1 min-w-0">
              <input
                type="text"
                placeholder="Search by policy number, customer name, or policy ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePolicyLookup()}
                className="flex-1 rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] text-[var(--foreground)] px-3 py-2 text-sm focus:border-[var(--accent-primary)] focus:outline-none"
              />
              <button
                onClick={handlePolicyLookup}
                disabled={!searchTerm.trim()}
                className="btn-primary rounded-[var(--border-radius-large)] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] px-4 py-2 text-sm font-medium text-white disabled:bg-[var(--foreground-muted)]"
              >
                Search
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {searchMode === "lookup" && selectedPolicy ? (
        /* Single Policy Edit View */
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Policy Details Form */}
            <div className="card rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] p-6 shadow-lg">
              <div className="mb-6 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-secondary-hover)] shadow-md">
                  <span className="text-xl">✏️</span>
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)]">
                  Edit Policy: {selectedPolicy.policy_number}
                </h3>
              </div>
              <div className="flex items-center justify-end mb-6">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(selectedPolicy)}
                    disabled={savingIds.has(selectedPolicy.id)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-slate-300"
                  >
                    {savingIds.has(selectedPolicy.id) ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(selectedPolicy.id)}
                    className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Insured Name
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      value={getDraftValue(selectedPolicy, "customer")}
                      onChange={(e) => updateDraft(selectedPolicy.id, "customer", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Policy Number
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      value={getDraftValue(selectedPolicy, "policy_number")}
                      onChange={(e) => updateDraft(selectedPolicy.id, "policy_number", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Line of Business
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      value={getDraftValue(selectedPolicy, "line_of_business")}
                      onChange={(e) => updateDraft(selectedPolicy.id, "line_of_business", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Carrier
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      value={getDraftValue(selectedPolicy, "carrier")}
                      onChange={(e) => updateDraft(selectedPolicy.id, "carrier", e.target.value)}
                    >
                      <option value="">Select carrier</option>
                      {carriers.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} {c.code && `(${c.code})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      MGA
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      value={getDraftValue(selectedPolicy, "mga")}
                      onChange={(e) => updateDraft(selectedPolicy.id, "mga", e.target.value)}
                    >
                      <option value="">Select MGA</option>
                      {mgas.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Transaction Type
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      value={getDraftValue(selectedPolicy, "transaction_type")}
                      onChange={(e) => updateDraft(selectedPolicy.id, "transaction_type", e.target.value)}
                    >
                      {TRANSACTION_TYPES.map((type) => (
                        <option key={type.code} value={type.code}>
                          {type.code} - {type.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Effective Date
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      value={getDraftValue(selectedPolicy, "effective_date")}
                      onChange={(e) => updateDraft(selectedPolicy.id, "effective_date", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Policy Origination Date
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      value={getDraftValue(selectedPolicy, "policy_origination_date")}
                      onChange={(e) => updateDraft(selectedPolicy.id, "policy_origination_date", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Premium Sold
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      value={getDraftValue(selectedPolicy, "premium_sold")}
                      onChange={(e) => updateDraft(selectedPolicy.id, "premium_sold", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Gross Commission %
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      value={getDraftValue(selectedPolicy, "policy_gross_comm_pct")}
                      onChange={(e) => updateDraft(selectedPolicy.id, "policy_gross_comm_pct", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Agent Paid Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      value={getDraftValue(selectedPolicy, "agent_paid_amount")}
                      onChange={(e) => updateDraft(selectedPolicy.id, "agent_paid_amount", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      value={getDraftValue(selectedPolicy, "invoice_number")}
                      onChange={(e) => updateDraft(selectedPolicy.id, "invoice_number", e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      value={getDraftValue(selectedPolicy, "notes")}
                      onChange={(e) => updateDraft(selectedPolicy.id, "notes", e.target.value)}
                    />
                  </div>
                </div>

                {/* Status Messages */}
                {rowError[selectedPolicy.id] && (
                  <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">
                    {rowError[selectedPolicy.id]}
                  </div>
                )}
                {rowSuccess[selectedPolicy.id] && (
                  <div className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    {rowSuccess[selectedPolicy.id]}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Commission Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <div className="card rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] p-6 shadow-lg">
                <div className="mb-6 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-secondary-hover)] shadow-md">
                    <span className="text-xl">💰</span>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--foreground)]">Commission Calculation</h3>
                </div>
                
                {(() => {
                  const calc = getRecalculatedCommission(selectedPolicy, drafts[selectedPolicy.id]);
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Agency Commission:</span>
                        <span className="font-medium text-indigo-600">{formatCurrency(calc.agencyCommission)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Agent Rate:</span>
                        <span className="font-medium">{formatPercent(calc.agentRate)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Agent Commission:</span>
                        <span className="font-medium text-green-600">{formatCurrency(calc.agentCommission)}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-slate-200 pt-3">
                        <span className="text-slate-600">Balance Due:</span>
                        <span className={`font-semibold ${calc.balanceDue >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                          {formatCurrency(calc.balanceDue)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      ) : searchMode === "lookup" && !selectedPolicy ? (
        /* No Policy Selected */
        <div className="card rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] p-8 shadow-lg text-center">
          <p className="text-[var(--foreground-muted)]">Use the search above to find a policy to edit.</p>
        </div>
      ) : (
        /* List View */
        <div className="card rounded-[var(--border-radius-large)] border border-[var(--border-color)] bg-[var(--background-secondary)] p-4 shadow-lg">
          <div className="overflow-x-auto">
            <table className="table-warm min-w-full text-left text-sm">
              <thead className="border-b border-[var(--border-color)] text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                <tr>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Policy #</th>
                  <th className="px-3 py-2">Carrier</th>
                  <th className="px-3 py-2">Premium</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Effective Date</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.length === 0 ? (
                  <tr>
                    <td className="px-3 py-8 text-slate-500 text-center" colSpan={7}>
                      No policies found. <Link href="/dashboard/policies/new" className="text-indigo-600 hover:text-indigo-700">Add your first policy</Link>.
                    </td>
                  </tr>
                ) : (
                  policies.slice(0, 20).map((policy) => {
                    const isSaving = savingIds.has(policy.id);
                    const error = rowError[policy.id];
                    const success = rowSuccess[policy.id];

                    return (
                      <tr key={policy.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <input
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
                            value={getDraftValue(policy, "customer")}
                            onChange={(e) => updateDraft(policy.id, "customer", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
                            value={getDraftValue(policy, "policy_number")}
                            onChange={(e) => updateDraft(policy.id, "policy_number", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
                            value={getDraftValue(policy, "carrier")}
                            onChange={(e) => updateDraft(policy.id, "carrier", e.target.value)}
                          >
                            <option value="">Select</option>
                            {carriers.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
                            value={getDraftValue(policy, "premium_sold")}
                            onChange={(e) => updateDraft(policy.id, "premium_sold", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
                            value={getDraftValue(policy, "transaction_type")}
                            onChange={(e) => updateDraft(policy.id, "transaction_type", e.target.value)}
                          >
                            {TRANSACTION_TYPES.map((type) => (
                              <option key={type.code} value={type.code}>
                                {type.code}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-slate-400 focus:outline-none"
                            value={getDraftValue(policy, "effective_date")}
                            onChange={(e) => updateDraft(policy.id, "effective_date", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2 text-right space-y-1">
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setSelectedPolicy(policy);
                                setSearchMode("lookup");
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleSave(policy)}
                              disabled={isSaving}
                              className="text-xs bg-slate-700 text-white px-2 py-1 rounded hover:bg-slate-800 disabled:bg-slate-300"
                            >
                              {isSaving ? "..." : "Save"}
                            </button>
                          </div>
                          {error && <div className="text-xs text-rose-600">{error}</div>}
                          {success && <div className="text-xs text-emerald-600">{success}</div>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {policies.length > 20 && (
              <div className="mt-4 text-center text-sm text-slate-500">
                Showing first 20 policies. Use search to find specific policies.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-slate-900 mb-3">
              Delete Policy
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete this policy? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const policy = policies.find(p => p.id === deleteConfirmId);
                  if (policy) handleDelete(policy);
                }}
                disabled={savingIds.has(deleteConfirmId)}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:bg-slate-300"
              >
                {savingIds.has(deleteConfirmId) ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-4 mt-8">
        <div className="mx-auto max-w-md text-center text-xs text-slate-500">
          <div className="flex items-center justify-center gap-2">
            <a href="/terms" className="hover:text-slate-700">Terms of Service</a>
            <span>·</span>
            <a href="/privacy" className="hover:text-slate-700">Privacy Policy</a>
          </div>
          <p className="mt-2">© 2025 Metro Technology Solutions LLC. All rights reserved.</p>
          <p className="mt-1">AMS Dash App™ is a trademark of Metro Technology Solutions LLC.</p>
        </div>
      </footer>
    </div>
  );
}

function EditPageRouter() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('id');
  
  // If a specific transaction ID is provided, show single edit form
  if (transactionId) {
    // Dynamic import to avoid SSR issues
    const SingleTransactionEdit = require("@/components/SingleTransactionEdit").default;
    return <SingleTransactionEdit transactionId={transactionId} />;
  }
  
  // Otherwise show the list view
  return <EditPoliciesPageContent />;
}

export default function EditPoliciesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <EditPageRouter />
    </Suspense>
  );
}
