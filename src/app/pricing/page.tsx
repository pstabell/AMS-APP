"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Floor = "agents" | "agencies";

const agentPlans = [
  {
    key: "starter",
    name: "Agent Starter",
    price: "$19.99",
    period: "/month",
    description: "Self-service commission tracking",
    trial: "14-day free trial",
    features: [
      "Upload and reconcile commission statements",
      "Track commissions across all carriers and lines",
      "Policy revenue ledger and reports",
      "Pending renewal tracking",
      "Carrier and MGA management",
    ],
    notIncluded: ["AI reconciliation", "AI dispute letters", "Email forwarding"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    key: "pro",
    name: "Agent Pro",
    price: "$49.99",
    period: "/month",
    description: "AI-assisted reconciliation and disputes",
    trial: "14-day free trial",
    features: [
      "Everything in Starter",
      "AI suggests reconciliation matches",
      "AI flags discrepancies automatically",
      "AI drafts dispute letters",
      "20 AI actions per day included",
    ],
    notIncluded: ["Email forwarding"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    key: "autopilot",
    name: "Agent Autopilot",
    price: "$79.99",
    period: "/month",
    description: "Hands-free — forward statements, wake up to results",
    trial: "14-day free trial",
    features: [
      "Everything in Pro",
      "Dedicated email forwarding address",
      "Auto-process statements when they arrive",
      "Daily summary reports delivered to you",
      "20 AI actions per day included",
    ],
    notIncluded: [],
    cta: "Start Free Trial",
    popular: false,
  },
];

const agencyPlans = [
  {
    key: "agency_self",
    name: "Agency Self-Service",
    price: "$99.99",
    period: "/month",
    description: "Multi-agent management and reconciliation",
    trial: "14-day free trial",
    features: [
      "Floor 1 (Agent) + Floor 2 (Agency) access",
      "Multi-agent dashboards and team management",
      "Agency-wide reconciliation across all agents",
      "Admin panel with commission rules and mappings",
      "1 user included, additional users $99/mo each",
    ],
    notIncluded: ["AI reconciliation", "Email forwarding"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    key: "agency_ai",
    name: "Agency AI",
    price: "$199",
    period: "/month",
    description: "Full AI agent managing your commission back office",
    trial: "14-day free trial",
    features: [
      "Everything in Agency Self-Service",
      "AI Agent manages all reconciliation automatically",
      "AI coaches agents on data entry quality",
      "Real-time metrics and carrier performance scoring",
      "Dedicated email forwarding for auto-processing",
      "Proactive alerts and daily summaries",
      "20 AI actions per day per user included",
      "1 user included, additional users $99/mo each",
    ],
    notIncluded: [],
    cta: "Start Free Trial",
    popular: true,
  },
];

export default function PricingPage() {
  const [floor, setFloor] = useState<Floor>("agents");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(planKey: string) {
    setLoading(planKey);
    try {
      const email = prompt("Enter your email to start your free trial:");
      if (!email) {
        setLoading(null);
        return;
      }
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, planKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    }
    setLoading(null);
  }

  const plans = floor === "agents" ? agentPlans : agencyPlans;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--background-secondary)]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/act-logo.png" alt="Agent Commission Tracker" width={40} height={40} className="drop-shadow-lg" />
              <span className="font-bold text-lg text-[var(--foreground)]">Agent Commission Tracker</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/services" className="text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)]">Services</Link>
              <Link href="/login" className="rounded-lg border border-[var(--border-color-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]">Sign In</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 pt-16 pb-8 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          Every Carrier. Every Line.{" "}
          <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--gold-primary)] bg-clip-text text-transparent">
            Every Commission.
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-[var(--foreground-muted)] mb-8">
          The only commission management platform that works with every carrier and every line of business. No IVANS required. Start with a 14-day free trial.
        </p>

        {/* Floor Toggle */}
        <div className="inline-flex rounded-xl bg-[var(--background-secondary)] border border-[var(--border-color)] p-1">
          <button
            onClick={() => setFloor("agents")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition ${
              floor === "agents"
                ? "bg-[var(--accent-primary)] text-white shadow-md"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            For Agents
          </button>
          <button
            onClick={() => setFloor("agencies")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition ${
              floor === "agencies"
                ? "bg-[var(--accent-primary)] text-white shadow-md"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            For Agencies
          </button>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className={`mx-auto max-w-6xl grid gap-8 ${plans.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2 max-w-4xl"}`}>
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative card-elevated rounded-2xl p-8 transition-all duration-300 hover:shadow-lg ${
                plan.popular ? "border-2 border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[var(--accent-primary)] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-[var(--foreground)]">{plan.name}</h3>
                <p className="text-sm text-[var(--foreground-muted)] mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-[var(--foreground)]">{plan.price}</span>
                <span className="text-[var(--foreground-muted)]">{plan.period}</span>
                <p className="text-sm text-[var(--success)] font-medium mt-1">{plan.trial}</p>
              </div>

              <button
                onClick={() => handleCheckout(plan.key)}
                disabled={loading === plan.key}
                className={`w-full rounded-lg px-6 py-3 text-sm font-semibold transition mb-6 ${
                  plan.popular
                    ? "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)]"
                    : "bg-[var(--background-secondary)] text-[var(--foreground)] border border-[var(--border-color-strong)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                } disabled:opacity-50`}
              >
                {loading === plan.key ? "Loading..." : plan.cta}
              </button>

              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[var(--foreground-muted)]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--success-muted)] text-[var(--success)]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    {feature}
                  </li>
                ))}
                {plan.notIncluded.map((feature, i) => (
                  <li key={`not-${i}`} className="flex items-start gap-3 text-sm text-[var(--foreground-subtle)]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--background-secondary)] text-[var(--foreground-subtle)]">
                      &mdash;
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Note */}
      <section className="border-t border-[var(--border-color)] bg-[var(--background-secondary)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold mb-4 text-[var(--foreground)]">How We Compare</h2>
          <p className="text-[var(--foreground-muted)] mb-8">
            Applied Epic charges $200-500 per user per month with no AI. A human employee doing reconciliation costs $3,000-5,000 per month. Our Agency AI plan with 10 users runs $1,090 per month and includes a virtual commission manager that works 24/7.
          </p>
          <Link href="/services" className="btn-secondary inline-flex items-center gap-2 px-6 py-3 text-base">
            Learn More About Our Services
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center text-xs text-[var(--foreground-muted)]">
          <p>&copy; 2026 Metro Point Technology LLC. All rights reserved.</p>
          <p className="mt-1">Agent Commission Tracker&trade; is a trademark of Metro Point Technology LLC.</p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <Link href="/terms" className="hover:text-[var(--foreground)]">Terms</Link>
            <Link href="/privacy" className="hover:text-[var(--foreground)]">Privacy</Link>
            <Link href="/services" className="hover:text-[var(--foreground)]">Services</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
