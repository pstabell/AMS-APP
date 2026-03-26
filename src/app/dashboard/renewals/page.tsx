"use client";

import { useEffect, useMemo, useState } from "react";

type RenewalPolicy = {
  id: string;
  customer: string;
  policy_number: string;
  carrier: string;
  premium_sold: number;
  expiration_date: string | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "";
  return value.split("T")[0];
}

function daysUntil(dateValue: string | null) {
  if (!dateValue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiration = new Date(dateValue);
  expiration.setHours(0, 0, 0, 0);
  const diffMs = expiration.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function rowTone(daysRemaining: number | null) {
  if (daysRemaining === null) return "bg-slate-50 text-slate-700";
  if (daysRemaining < 30) return "bg-rose-50 text-rose-900";
  if (daysRemaining < 60) return "bg-amber-50 text-amber-900";
  return "bg-emerald-50 text-emerald-900";
}

export default function RenewalsPage() {
  const [policies, setPolicies] = useState<RenewalPolicy[]>([]);
  const [noExpirationPolicies, setNoExpirationPolicies] = useState<RenewalPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRenewals = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/renewals");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load renewals.");
        }

        setPolicies(payload.data ?? []);
        setNoExpirationPolicies(payload.noExpirationPolicies ?? []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to load renewals.";
        setError(message);
        setPolicies([]);
        setNoExpirationPolicies([]);
      }

      setLoading(false);
    };

    loadRenewals();
  }, []);

  // Count both regular renewals and policies without expiration dates
  const total = useMemo(() => policies.length + noExpirationPolicies.length, [policies, noExpirationPolicies]);

  const groupedPolicies = useMemo(() => {
    const groups: Record<string, RenewalPolicy[]> = {};
    
    policies.forEach((policy) => {
      // Policies here should all have expiration dates since they're filtered by the API
      const date = new Date(policy.expiration_date!);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(policy);
    });

    // Sort groups by month and sort policies within each group by expiration date
    const sortedGroups = Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, policies]) => ({
        monthKey: key,
        monthLabel: new Date(key + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        policies: policies.sort((a, b) => 
          new Date(a.expiration_date || '').getTime() - new Date(b.expiration_date || '').getTime()
        )
      }));

    return sortedGroups;
  }, [policies]);

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] shadow-lg">
          <span className="text-3xl">🔄</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-1">Pending Policy Renewals</h2>
          <p className="text-[var(--foreground-muted)] flex items-center gap-2">
            <span className="text-lg">⏰</span>
            Review policies expiring in the next 90 days and prioritize outreach
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border-2 border-[var(--error-red)] bg-gradient-to-br from-[var(--background)] to-[var(--background-secondary)] px-6 py-4 text-sm text-[var(--error-red)] shadow-lg flex items-center gap-3">
          <span className="text-xl">❌</span>
          <div>
            <p className="font-semibold">Error Loading Renewals</p>
            <p className="text-xs opacity-80">{error}</p>
          </div>
        </div>
      ) : null}

      <div className="card">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-secondary-hover)] shadow-md">
            <span className="text-xl">📋</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-[var(--foreground)]">Renewal Summary</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              {policies.length > 0 && `${policies.length} renewals pending`}
              {policies.length > 0 && noExpirationPolicies.length > 0 && " • "}
              {noExpirationPolicies.length > 0 && `${noExpirationPolicies.length} missing expiration dates`}
              {total === 0 && "No upcoming renewals."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--foreground-muted)]">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[var(--error-red)]" />
              <span>🚨 Under 30 days</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[var(--highlight-amber)]" />
              <span>⚠️ 30-60 days</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[var(--success-green)]" />
              <span>✅ 60-90 days</span>
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-[var(--foreground-muted)]">
              <div className="flex flex-col items-center gap-3">
                <span className="text-3xl animate-pulse">⏳</span>
                <div>
                  <p className="font-semibold">Loading renewals...</p>
                  <p className="text-xs">Please wait</p>
                </div>
              </div>
            </div>
          ) : policies.length === 0 ? (
            <div className="text-center py-8 text-[var(--foreground-muted)]">
              <div className="flex flex-col items-center gap-3">
                <span className="text-3xl">✅</span>
                <div>
                  <p className="font-semibold">All caught up!</p>
                  <p className="text-xs">No policies expiring in the next 90 days</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* No Expiration Date Section */}
              {noExpirationPolicies.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 border-b-2 border-[var(--error-red)] pb-3 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-[var(--error-red)] to-red-600">
                      <span className="text-lg text-white">⚠️</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[var(--error-red)]">
                        Missing Expiration Date
                      </h4>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        {noExpirationPolicies.length} policies requiring attention
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[var(--error-red)] text-white">
                        🚨 DATA ISSUE
                      </span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="table-warm w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left">👤 Customer Name</th>
                          <th className="text-left">📄 Policy Number</th>
                          <th className="text-left">🏢 Carrier</th>
                          <th className="text-right">💰 Current Premium</th>
                          <th className="text-left">📅 Expiration Date</th>
                          <th className="text-left">⚙️ Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {noExpirationPolicies.map((policy) => (
                          <tr
                            key={policy.id}
                            className="group bg-red-50 hover:bg-red-100 border-l-4 border-[var(--error-red)]"
                          >
                            <td className="font-semibold text-[var(--foreground)]">
                              {policy.customer}
                            </td>
                            <td className="text-[var(--foreground-muted)]">{policy.policy_number}</td>
                            <td className="text-[var(--foreground-muted)]">{policy.carrier}</td>
                            <td className="text-right font-semibold text-[var(--accent-primary)]">
                              {formatCurrency(Number(policy.premium_sold) || 0)}
                            </td>
                            <td className="font-semibold text-[var(--error-red)]">
                              <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-bold bg-[var(--error-red)] text-white">
                                ❌ MISSING
                              </span>
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => window.open(`/dashboard/policies/${policy.id}`, "_blank")}
                                  className="rounded-xl bg-[var(--error-red)] hover:bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-lg transition-all flex items-center gap-1"
                                  title="Edit policy to add expiration date"
                                >
                                  ✏️ Fix
                                </button>
                                <button
                                  type="button"
                                  onClick={() => window.open(`/dashboard/policies/${policy.id}`, "_blank")}
                                  className="rounded-xl bg-[var(--accent-secondary)] hover:bg-[var(--accent-secondary-hover)] px-3 py-1 text-xs font-bold text-white shadow-lg transition-all flex items-center gap-1"
                                  title="View policy details"
                                >
                                  👁️ View
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Regular Renewal Groups */}
              {groupedPolicies.map((group) => (
              <div key={group.monthKey} className="space-y-3">
                <div className="flex items-center gap-3 border-b-2 border-[var(--accent-primary)] pb-3 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-hover)]">
                    <span className="text-lg text-white">📅</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[var(--foreground)]">
                      {group.monthLabel}
                    </h4>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      {group.policies.length} policies expiring
                    </p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="table-warm w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left">👤 Customer Name</th>
                        <th className="text-left">📄 Policy Number</th>
                        <th className="text-left">🏢 Carrier</th>
                        <th className="text-right">💰 Current Premium</th>
                        <th className="text-left">📅 Expiration Date</th>
                        <th className="text-left">⏰ Days Until Expiration</th>
                        <th className="text-left">⚙️ Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.policies.map((policy) => {
                        const remaining = daysUntil(policy.expiration_date);
                        const createRenewalUrl = `/dashboard/policies/new?renewal=${policy.id}&customer=${encodeURIComponent(policy.customer)}&carrier=${encodeURIComponent(policy.carrier)}&premium=${policy.premium_sold}`;
                        
                        return (
                          <tr
                            key={policy.id}
                            className="group"
                          >
                            <td className="font-semibold text-[var(--foreground)]">
                              {policy.customer}
                            </td>
                            <td className="text-[var(--foreground-muted)]">{policy.policy_number}</td>
                            <td className="text-[var(--foreground-muted)]">{policy.carrier}</td>
                            <td className="text-right font-semibold text-[var(--accent-primary)]">
                              {formatCurrency(Number(policy.premium_sold) || 0)}
                            </td>
                            <td className="text-[var(--foreground-muted)]">
                              {formatDate(policy.expiration_date)}
                            </td>
                            <td className="font-semibold">
                              {remaining === null ? "—" : (
                                <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-bold ${
                                  remaining < 30 ? "bg-[var(--error-red)] text-white" :
                                  remaining < 60 ? "bg-[var(--highlight-amber)] text-white" :
                                  "bg-[var(--success-green)] text-white"
                                }`}>
                                  {remaining} days
                                  {remaining < 30 && "🚨"}
                                  {remaining >= 30 && remaining < 60 && "⚠️"}
                                  {remaining >= 60 && "✅"}
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => window.open(createRenewalUrl, "_blank")}
                                  className="rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] px-3 py-1 text-xs font-bold text-white shadow-lg transition-all flex items-center gap-1"
                                  title="Create renewal transaction"
                                >
                                  🔄 Renew
                                </button>
                                <button
                                  type="button"
                                  onClick={() => window.open(`/dashboard/policies/${policy.id}`, "_blank")}
                                  className="rounded-xl bg-[var(--accent-secondary)] hover:bg-[var(--accent-secondary-hover)] px-3 py-1 text-xs font-bold text-white shadow-lg transition-all flex items-center gap-1"
                                  title="View policy details"
                                >
                                  👁️ View
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              ))}
            </>
          )}
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
          © 2026 All rights reserved
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm">®</span>
          <p className="text-xs text-[var(--foreground-subtle)]">Metro Point is a registered trademark</p>
        </div>
      </footer>
    </>
  );
}
