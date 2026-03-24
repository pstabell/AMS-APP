"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { Customer, PolicyTerm } from "@/lib/customers";
import { decodeCustomerId } from "@/lib/customers";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return value.split("T")[0];
}

export default function CustomerDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const customerId = params.id as string;
  const customerName = decodeCustomerId(customerId);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [policyTerms, setPolicyTerms] = useState<PolicyTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"policies" | "summary">("policies");

  useEffect(() => {
    const loadCustomer = async () => {
      if (!user?.email) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/customers/${customerId}`, {
          headers: {
            "x-user-email": user.email,
          },
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load customer.");
        }

        setCustomer(payload.customer);
        setPolicyTerms(payload.policyTerms || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load customer.";
        setError(message);
      }
      setLoading(false);
    };

    loadCustomer();
  }, [user?.email, customerId]);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard", icon: "🏠" },
    { label: "Customers", href: "/dashboard/customers", icon: "👥" },
    { label: customerName, icon: "👤" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-slate-600">Loading customer...</p>
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
        <Link href="/dashboard/customers" className="text-blue-600 hover:text-blue-800">
          ← Back to customers
        </Link>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">👤</span>
          <p className="text-slate-600">Customer not found.</p>
          <Link href="/dashboard/customers" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Back to customers
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
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <span className="text-4xl">👤</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--foreground)]">{customer.name}</h1>
            <p className="text-[var(--foreground-muted)] mt-1 flex items-center gap-2">
              <span className="text-blue-500">●</span>
              {policyTerms.length} policy term{policyTerms.length !== 1 ? "s" : ""} • {customer.transactionCount} transaction{customer.transactionCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/customers"
          className="text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          ← Back to customers
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-100">
              <span className="text-xl">📄</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Policy Terms</p>
              <p className="text-2xl font-bold text-slate-900">{policyTerms.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-100">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Premium</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(customer.totalPremium)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-100">
              <span className="text-xl">💎</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Agent Commission</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(customer.totalAgentComm)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-100">
              <span className="text-xl">🏢</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Carriers</p>
              <p className="text-2xl font-bold text-purple-600">{customer.carriers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("policies")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "policies"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            📋 Policy Terms
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "summary"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            📊 Summary
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === "policies" && (
        <div className="space-y-4">
          {/* Navigation Hint */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-blue-600 font-semibold">💡 Policy Terms:</span>
              <span className="text-slate-700">
                Each policy term groups all transactions (NEW, RWL, END, CAN, etc.) for that policy. Click to see transaction details.
              </span>
            </div>
          </div>

          {/* Policy Terms List */}
          {policyTerms.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <span className="text-4xl mb-4 block">📋</span>
              <p className="text-slate-600">No policy terms found for this customer.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gradient-to-r from-blue-100 to-indigo-100 border-b-2 border-blue-300">
                    <tr>
                      <th className="px-4 py-3 font-bold text-slate-800">📄 Policy Number</th>
                      <th className="px-4 py-3 font-bold text-slate-800">🏢 Carrier</th>
                      <th className="px-4 py-3 font-bold text-slate-800">📁 LOB</th>
                      <th className="px-4 py-3 font-bold text-slate-800 text-center">📝 Transactions</th>
                      <th className="px-4 py-3 font-bold text-slate-800 text-right">💰 Premium</th>
                      <th className="px-4 py-3 font-bold text-slate-800 text-right">💎 Agent Comm</th>
                      <th className="px-4 py-3 font-bold text-slate-800 text-right">✅ Paid</th>
                      <th className="px-4 py-3 font-bold text-slate-800 text-right">⏳ Balance</th>
                      <th className="px-4 py-3 font-bold text-slate-800">📅 Latest Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policyTerms.map((term) => (
                      <tr
                        key={term.id}
                        className="border-b border-slate-100 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/customers/${customerId}/policies/${encodeURIComponent(term.policyNumber)}`}
                            className="font-bold text-slate-900 hover:text-blue-700 transition-colors flex items-center gap-2"
                          >
                            <span className="font-mono">{term.policyNumber}</span>
                            <span className="text-blue-500 text-xs">→</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{term.carrier}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600">{term.lineOfBusiness || "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                            {term.transactionCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-emerald-600">
                            {formatCurrency(term.totalPremium)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-amber-600">
                            {formatCurrency(term.totalAgentComm)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-emerald-600">
                            {formatCurrency(term.totalPaid)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${term.balanceDue > 0 ? "text-amber-600" : "text-slate-600"}`}>
                            {formatCurrency(term.balanceDue)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600">
                            {formatDate(term.latestEffectiveDate)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "summary" && (
        <div className="space-y-6">
          {/* Carriers */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>🏢</span> Carriers
            </h3>
            <div className="flex flex-wrap gap-2">
              {customer.carriers.map((carrier) => (
                <span
                  key={carrier}
                  className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700"
                >
                  <span>•</span> {carrier}
                </span>
              ))}
            </div>
          </div>

          {/* Commission Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>💎</span> Commission Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Total Premium</span>
                <span className="font-bold text-emerald-600">{formatCurrency(customer.totalPremium)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Agency Commission</span>
                <span className="font-bold text-indigo-600">{formatCurrency(customer.totalAgencyComm)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Agent Commission</span>
                <span className="font-bold text-amber-600">{formatCurrency(customer.totalAgentComm)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600">Total Transactions</span>
                <span className="font-bold text-slate-900">{customer.policyCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
