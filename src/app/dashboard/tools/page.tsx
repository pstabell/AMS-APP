"use client";

import { useMemo, useState } from "react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toLocalDate(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export default function ToolsPage() {
  const [commissionPremium, setCommissionPremium] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const [termStart, setTermStart] = useState("");
  const [termEnd, setTermEnd] = useState("");
  const [monthlyPremium, setMonthlyPremium] = useState("");
  const [termMonths, setTermMonths] = useState("12");

  const commissionAmount = useMemo(() => {
    const premium = parseNumber(commissionPremium);
    const rate = parseNumber(commissionRate);
    if (!premium || !rate) return 0;
    return (premium * rate) / 100;
  }, [commissionPremium, commissionRate]);

  const termSummary = useMemo(() => {
    const start = toLocalDate(termStart);
    const end = toLocalDate(termEnd);
    if (!start || !end) {
      return { days: 0, months: 0, years: 0, warning: "" };
    }
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const safeDays = Number.isFinite(diffDays) ? diffDays : 0;
    const months = safeDays / 30.4375;
    const years = safeDays / 365.25;
    const warning = safeDays < 0 ? "End date is before the start date." : "";
    return { days: safeDays, months, years, warning };
  }, [termStart, termEnd]);

  const estimatedAnnualPremium = useMemo(() => {
    const premium = parseNumber(monthlyPremium);
    const months = parseNumber(termMonths);
    if (!premium || !months) return 0;
    return premium * months;
  }, [monthlyPremium, termMonths]);

  const inputClass =
    "w-full rounded-xl border-2 border-[var(--border-color)] bg-[var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-20 transition-all";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] shadow-lg">
          <span className="text-3xl">🛠️</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-1">Tools</h2>
          <p className="text-[var(--foreground-muted)] flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            Quick utilities for commissions, dates, and premium planning
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card">
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] shadow-md">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--foreground)]">
                Commission Calculator
              </h3>
              <p className="text-sm text-[var(--foreground-muted)]">
                Estimate commission from premium and rate.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2" htmlFor="premium">
                <span className="text-lg">💸</span>
                Premium Amount
              </label>
              <input
                id="premium"
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={commissionPremium}
                onChange={(event) => setCommissionPremium(event.target.value)}
                placeholder="e.g. 12500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2" htmlFor="rate">
                <span className="text-lg">📊</span>
                Commission Rate (%)
              </label>
              <input
                id="rate"
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={commissionRate}
                onChange={(event) => setCommissionRate(event.target.value)}
                placeholder="e.g. 12.5"
              />
            </div>

            <div className="rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] px-6 py-4 shadow-md">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white opacity-90">
                Estimated Commission
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {formatCurrency(commissionAmount)}
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-secondary-hover)] shadow-md">
              <span className="text-xl">📅</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--foreground)]">Date Calculator</h3>
              <p className="text-sm text-[var(--foreground-muted)]">
                Calculate days and term length between dates.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2" htmlFor="termStart">
                <span className="text-lg">🗓️</span>
                Start Date
              </label>
              <input
                id="termStart"
                type="date"
                className={inputClass}
                value={termStart}
                onChange={(event) => setTermStart(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2" htmlFor="termEnd">
                <span className="text-lg">📆</span>
                End Date
              </label>
              <input
                id="termEnd"
                type="date"
                className={inputClass}
                value={termEnd}
                onChange={(event) => setTermEnd(event.target.value)}
              />
            </div>

            <div className="rounded-xl bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-secondary-hover)] px-6 py-4 shadow-md">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white opacity-90">
                Term Length
              </p>
              <div className="mt-3 space-y-2 text-sm text-white">
                <div className="flex items-center justify-between">
                  <span>📅 Days</span>
                  <span className="font-bold text-white">
                    {formatNumber(termSummary.days)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>📆 Months (approx)</span>
                  <span className="font-bold text-white">
                    {formatNumber(termSummary.months)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🗓️ Years (approx)</span>
                  <span className="font-bold text-white">
                    {formatNumber(termSummary.years)}
                  </span>
                </div>
              </div>
            </div>

            {termSummary.warning ? (
              <div className="rounded-2xl border-2 border-[var(--error-red)] bg-gradient-to-br from-[var(--background)] to-[var(--background-secondary)] px-4 py-3 text-sm text-[var(--error-red)] shadow-lg flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <p className="font-semibold">{termSummary.warning}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="card">
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--highlight-amber)] to-[var(--accent-primary)] shadow-md">
              <span className="text-xl">📈</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--foreground)]">
                Premium Estimator
              </h3>
              <p className="text-sm text-[var(--foreground-muted)]">
                Estimate annual premium from monthly payments.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2" htmlFor="monthly">
                <span className="text-lg">📅</span>
                Monthly Premium
              </label>
              <input
                id="monthly"
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={monthlyPremium}
                onChange={(event) => setMonthlyPremium(event.target.value)}
                placeholder="e.g. 215"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2" htmlFor="months">
                <span className="text-lg">🗓️</span>
                Months in Term
              </label>
              <input
                id="months"
                type="number"
                min="1"
                step="1"
                className={inputClass}
                value={termMonths}
                onChange={(event) => setTermMonths(event.target.value)}
              />
            </div>

            <div className="rounded-xl bg-gradient-to-br from-[var(--highlight-amber)] to-[var(--accent-primary)] px-6 py-4 shadow-md">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white opacity-90">
                Estimated Term Premium
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {formatCurrency(estimatedAnnualPremium)}
              </p>
            </div>
          </div>
        </section>
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
    </div>
  );
}
