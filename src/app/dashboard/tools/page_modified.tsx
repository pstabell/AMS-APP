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
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Tools 🛠️</h2>
        <p className="text-sm text-slate-600">
          Quick utilities for commissions, dates, and premium planning.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">
              Commission Calculator
            </h3>
            <p className="text-sm text-slate-600">
              Estimate commission from premium and rate.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="premium">
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

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="rate">
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

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Estimated Commission
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrency(commissionAmount)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">Date Calculator</h3>
            <p className="text-sm text-slate-600">
              Calculate days and term length between dates.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="termStart">
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

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="termEnd">
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

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Term Length
              </p>
              <div className="mt-2 space-y-2 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Days</span>
                  <span className="font-semibold text-slate-900">
                    {formatNumber(termSummary.days)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Months (approx)</span>
                  <span className="font-semibold text-slate-900">
                    {formatNumber(termSummary.months)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Years (approx)</span>
                  <span className="font-semibold text-slate-900">
                    {formatNumber(termSummary.years)}
                  </span>
                </div>
              </div>
            </div>

            {termSummary.warning ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {termSummary.warning}
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">
              Premium Estimator
            </h3>
            <p className="text-sm text-slate-600">
              Estimate annual premium from monthly payments.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="monthly">
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

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="months">
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

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Estimated Term Premium
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrency(estimatedAnnualPremium)}
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-10 border-t border-slate-300 pt-4 text-sm text-slate-500">
        <div className="space-x-4">
          <a href="/terms" className="hover:underline">
            Terms of Service
          </a>
          <a href="/privacy" className="hover:underline">
            Privacy Policy
          </a>
          <span>                    © 2024 Metro Point Technology</span>
        </div>
      </footer>
    </div>
  );
}
