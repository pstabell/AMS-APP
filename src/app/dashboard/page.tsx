"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MetricCard from "@/components/MetricCard";
import AIActionsWidget from "@/components/AIActionsWidget";
import DataTable, { ColumnDef } from "@/components/DataTable";

// Extended policy type with reconciliation status
type DashboardPolicy = {
  id: string;
  customer: string;
  policy_number: string;
  carrier: string;
  premium_sold: number;
  agent_estimated_comm: number;
  effective_date: string;
  isReconciled: boolean;
};
import { useAuth } from "@/contexts/AuthContext";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric", 
    year: "numeric"
  });
}

type DashboardMetrics = {
  transactions: {
    total: number;
    thisMonth: number;
    reconciliation: number;
  };
  policies: {
    unique: number;
    active: number;
    cancelled: number;
  };
  commission: {
    due: number;
    earned: number;
  };
};

export default function DashboardPage() {
  const { user, currentFloor } = useAuth();
  const [policies, setPolicies] = useState<DashboardPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    transactions: { total: 0, thisMonth: 0, reconciliation: 0 },
    policies: { unique: 0, active: 0, cancelled: 0 },
    commission: { due: 0, earned: 0 }
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Floor 1: filter by user_id (agent sees own data)
        // Floor 2: no filter (agency sees all data)
        const params = new URLSearchParams({ floor: String(currentFloor) });
        if (currentFloor === 1 && user?.id) {
          params.set("userId", user.id);
        }
        const response = await fetch(`/api/dashboard?${params}`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || "Unable to load dashboard metrics.");
        }
        const payload = await response.json();
        
        // Map recent policies to the format the table expects
        const recentData = (payload?.recent ?? []).map((r: any) => ({
          id: r.id,
          customer: r.customer || "—",
          policy_number: r.policyNumber || "—",
          carrier: r.carrier || "—",
          premium_sold: r.premiumSold || 0,
          agent_estimated_comm: r.commission || 0,
          effective_date: r.effectiveDate || "",
          isReconciled: r.isReconciled || false,
        })) as DashboardPolicy[];
        setPolicies(recentData);

        // Use pre-calculated metrics from API (calculated from ALL 826+ records)
        const m = payload.metrics;
        setMetrics({
          transactions: {
            total: m?.totalTransactions ?? 0,
            thisMonth: m?.thisMonth ?? 0,
            reconciliation: m?.stmtTransactions ?? 0
          },
          policies: {
            unique: m?.uniquePolicies ?? 0,
            active: m?.active ?? 0,
            cancelled: m?.cancelled ?? 0
          },
          commission: {
            due: m?.totalCommDue ?? 0,
            earned: m?.totalCommEarned ?? 0
          }
        });

      } catch (err: any) {
        setError(err.message || "Unable to load dashboard metrics.");
        setPolicies([]);
      }

      setLoading(false);
    };

    loadData();
  }, [currentFloor, user?.id]);

  // Filter policies by client search
  const filteredPolicies = useMemo(() => {
    if (!clientSearch.trim()) {
      return policies.slice(0, 10); // Recent 10
    }
    const lowerSearch = clientSearch.toLowerCase();
    return policies
      .filter((p) => p.customer.toLowerCase().includes(lowerSearch))
      .slice(0, 10);
  }, [clientSearch, policies]);

  // Row styling for reconciled transactions
  const getRowClassName = (policy: DashboardPolicy) => {
    if (policy.isReconciled) {
      return 'row-reconciled'; // Uses CSS variable-based styling
    }
    return '';
  };

  // Table columns definition
  const columns: ColumnDef<DashboardPolicy>[] = [
    {
      key: 'customer',
      header: '👤 Customer',
      accessor: (policy) => (
        <Link
          href={`/dashboard/policies/${policy.id}`}
          className="font-semibold text-[var(--foreground)] hover:text-[var(--accent-primary)] transition-colors flex items-center gap-2"
        >
          {policy.customer}
        </Link>
      ),
      sortable: true
    },
    {
      key: 'policy_number',
      header: '📄 Policy #',
      accessor: (policy) => (
        <span className="font-mono text-sm font-medium text-[var(--foreground-muted)]">
          {policy.policy_number}
        </span>
      )
    },
    {
      key: 'carrier',
      header: '🏢 Carrier', 
      accessor: (policy) => (
        <span className="font-medium text-[var(--foreground)]">
          {policy.carrier}
        </span>
      ),
      sortable: true
    },
    {
      key: 'premium_sold',
      header: '💰 Premium',
      accessor: (policy) => (
        <span className="font-semibold text-[var(--success)]">
          {formatCurrency(Number(policy.premium_sold) || 0)}
        </span>
      ),
      sortable: true
    },
    {
      key: 'agent_estimated_comm',
      header: '💎 Commission',
      accessor: (policy) => (
        <span className="font-semibold text-[var(--gold-primary)]">
          {formatCurrency(Number(policy.agent_estimated_comm) || 0)}
        </span>
      ),
      sortable: true
    },
    {
      key: 'effective_date',
      header: '📅 Effective',
      accessor: (policy) => (
        <span className="text-sm font-medium text-[var(--foreground-muted)]">
          {formatDate(policy.effective_date)}
        </span>
      ),
      sortable: true
    }
  ];

  return (
    <div className="space-y-8 min-h-screen text-[var(--foreground)] bg-[var(--background)]">
      {/* Dashboard Header */}
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-accent shadow-lg glow-accent">
            <span className="text-3xl">📊</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
              Commission Dashboard
            </h1>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              Real-time insights into your commission performance
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/policies/new"
          className="btn-primary inline-flex items-center gap-2"
        >
          <span>+</span>
          Add New Policy
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-[var(--error)] bg-[var(--error-muted)] px-5 py-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--error-muted)]">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <p className="font-semibold text-[var(--error)]">Unable to load data</p>
            <p className="text-sm text-[var(--foreground-muted)]">{error}</p>
          </div>
        </div>
      )}

      {/* Metrics Grid — compact 4-column layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total Transactions"
          value={metrics.transactions.total}
          icon="📊"
          color="info"
          isLoading={loading}
          sublabel="All time"
        />
        <MetricCard
          label="This Month"
          value={metrics.transactions.thisMonth}
          icon="📅"
          color="success" 
          isLoading={loading}
          sublabel="Current month"
        />
        <MetricCard
          label="Unique Policies"
          value={metrics.policies.unique}
          icon="📄"
          color="info"
          isLoading={loading}
          sublabel="Distinct policies"
        />
        <MetricCard
          label="Reconciliation"
          value={metrics.transactions.reconciliation}
          icon="🔄"
          color="gold"
          isLoading={loading}
          sublabel="-STMT- entries"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Active Policies"
          value={metrics.policies.active}
          icon="✅"
          color="success"
          isLoading={loading}
          sublabel="In force"
          trend="up"
        />
        <MetricCard
          label="Cancelled"
          value={metrics.policies.cancelled}
          icon="❌"
          color="error"
          isLoading={loading}
          sublabel="Cancelled & lapsed"
          trend="down"
        />
        <MetricCard
          label="Commission Due"
          value={formatCurrency(metrics.commission.due)}
          icon="💰"
          color="gold"
          isLoading={loading}
          sublabel="Outstanding"
          trend="up"
        />
        <MetricCard
          label="Commission Earned"
          value={formatCurrency(metrics.commission.earned)}
          icon="💎"
          color="success"
          isLoading={loading}
          sublabel="From active policies"
          trend="up"
        />
      </div>

      {/* AI Actions Widget */}
      <AIActionsWidget />

      {/* Recent Policies Table */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="p-2.5 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border-color)]">
            <span className="text-xl">📋</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Recent Policy Transactions</h3>
            <p className="text-xs text-[var(--foreground-muted)]">
              Latest {clientSearch ? 'filtered' : '10'} transactions 
              {clientSearch && ` for "${clientSearch}"`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-[var(--foreground-subtle)] text-sm">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search client..."
                className="block w-48 pl-9 pr-3 py-2 text-sm rounded-lg"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
            </div>
          </div>
          <Link
            href="/dashboard/policies"
            className="text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] font-medium transition-colors flex items-center gap-1 text-sm"
          >
            View All <span className="text-xs">→</span>
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={filteredPolicies}
          isLoading={loading}
          emptyMessage={clientSearch ? `No policies found for "${clientSearch}"` : "No policies available"}
          emptyIcon={clientSearch ? "🔍" : "📝"}
          searchTerm={clientSearch}
          rowClassName={getRowClassName}
        />
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-[var(--border-color)]">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg">🛡️</span>
            <p className="font-semibold text-[var(--foreground)]">{currentFloor === 2 ? "Agency" : "Agent"} Commission Tracker</p>
          </div>
          <p className="text-xs text-[var(--foreground-subtle)]">
            Powered by Metro Point Technology • Copyright © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
