"use client";

import Link from "next/link";
import Image from "next/image";

// Icon components for services
const OptimizationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IntegrationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 16l4-4-4-4"/>
    <path d="M6 8l-4 4 4 4"/>
    <path d="M14.5 4l-5 16"/>
  </svg>
);

const DevelopmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
    <path d="M7 8l3 3-3 3"/>
    <line x1="13" y1="14" x2="17" y2="14"/>
  </svg>
);

const AIIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
    <circle cx="7.5" cy="14.5" r="1.5"/>
    <circle cx="16.5" cy="14.5" r="1.5"/>
  </svg>
);

const services = [
  {
    icon: <OptimizationIcon />,
    title: "Agency System Optimization",
    description: "Already have an AMS? We help you get the most out of it.",
    details: [
      "Deep-dive analysis of your current agency management system setup",
      "Identify unused features that could save your team hours each week",
      "Custom workflow design tailored to how your agency actually operates",
      "Training sessions so your whole team can work smarter, not harder",
    ],
    tagline: "Stop fighting your software — let it work for you.",
  },
  {
    icon: <IntegrationIcon />,
    title: "Integration & Automation",
    description: "Connect all your systems so data flows seamlessly.",
    details: [
      "Link carrier portals directly to your AMS for real-time policy updates",
      "Sync your CRM, accounting software, and commission tracking automatically",
      "Eliminate double-entry and reduce those frustrating data mismatches",
      "Set up alerts and notifications so nothing falls through the cracks",
    ],
    tagline: "One source of truth — everywhere your team needs it.",
  },
  {
    icon: <DevelopmentIcon />,
    title: "Custom Development",
    description: "When off-the-shelf doesn't cut it, we build what you need.",
    details: [
      "Commission tracking tools designed around your specific split structures",
      "Custom reporting dashboards that show exactly what matters to you",
      "Agency-specific calculators, quote tools, and internal applications",
      "Integrations with niche systems or legacy software you can't replace yet",
    ],
    tagline: "Your agency is unique. Your tools should be too.",
  },
  {
    icon: <AIIcon />,
    title: "AI-Powered Solutions",
    description: "Put intelligent automation to work for your agency.",
    details: [
      "Smart document processing that reads and extracts policy data",
      "AI assistants that help your team answer client questions faster",
      "Automated follow-up sequences that feel personal, not robotic",
      "Predictive analytics to spot renewal risks before they become lapsed policies",
    ],
    tagline: "The future of insurance operations — available today.",
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--background-secondary)]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/act-logo.png"
                alt="Agent Commission Tracker"
                width={40}
                height={40}
                className="drop-shadow-lg"
              />
              <span className="font-bold text-lg text-[var(--foreground)]">Agent Commission Tracker</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/services"
                className="text-sm font-medium text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)]"
              >
                Services
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-[var(--border-color-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-primary-hover)]"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary-muted)] via-transparent to-[var(--gold-muted)] opacity-30"></div>
        </div>
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--accent-primary)]">
            Technology Services for Insurance Agencies
          </p>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
            We Help Insurance Agencies{" "}
            <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--gold-primary)] bg-clip-text text-transparent">
              Work Smarter
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-[var(--foreground-muted)]">
            From optimizing your existing systems to building custom solutions, we&apos;re your dedicated technology partner. No jargon, no fluff — just practical tools that make your agency run better.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="#contact"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-base"
            >
              Schedule a Free Consultation
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/>
                <path d="M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <Link
              href="/login"
              className="btn-secondary inline-flex items-center gap-2 px-6 py-3 text-base"
            >
              Try Our Commission Tracker
            </Link>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
              What We Do
            </h2>
            <p className="mx-auto max-w-2xl text-[var(--foreground-muted)]">
              Every insurance agency has different needs. Here&apos;s how we can help yours.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {services.map((service, index) => (
              <div
                key={index}
                className="group card-elevated relative overflow-hidden p-8 transition-all duration-300 hover:border-[var(--accent-primary)] hover:shadow-lg"
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--accent-primary-muted)] opacity-0 transition-all duration-300 group-hover:opacity-100"></div>
                
                <div className="relative z-10">
                  <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] p-3 text-white shadow-md">
                    {service.icon}
                  </div>
                  
                  <h3 className="mb-2 text-xl font-bold text-[var(--foreground)]">
                    {service.title}
                  </h3>
                  <p className="mb-6 text-[var(--foreground-muted)]">
                    {service.description}
                  </p>
                  
                  <ul className="mb-6 space-y-3">
                    {service.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-[var(--foreground-muted)]">
                        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--success-muted)] text-[var(--success)]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                  
                  <p className="text-sm font-semibold italic text-[var(--accent-primary)]">
                    {service.tagline}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="border-y border-[var(--border-color)] bg-[var(--background-secondary)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
            Why Work With Us?
          </h2>
          <p className="mb-12 text-lg text-[var(--foreground-muted)]">
            We&apos;re not just tech people — we understand insurance operations.
          </p>
          
          <div className="grid gap-8 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--gold-muted)] text-2xl">
                🎯
              </div>
              <h3 className="mb-2 font-semibold text-[var(--foreground)]">Insurance-Focused</h3>
              <p className="text-sm text-[var(--foreground-muted)]">
                We speak your language. Commissions, splits, carrier downloads, renewals — we get it.
              </p>
            </div>
            
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--success-muted)] text-2xl">
                🤝
              </div>
              <h3 className="mb-2 font-semibold text-[var(--foreground)]">Partnership Approach</h3>
              <p className="text-sm text-[var(--foreground-muted)]">
                We&apos;re not hit-and-run consultants. We stick around to make sure everything works.
              </p>
            </div>
            
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--info-muted)] text-2xl">
                💡
              </div>
              <h3 className="mb-2 font-semibold text-[var(--foreground)]">Practical Solutions</h3>
              <p className="text-sm text-[var(--foreground-muted)]">
                No over-engineered nonsense. Just tools that solve real problems your team faces every day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="card-accent overflow-hidden rounded-2xl">
            <div className="p-8 sm:p-12">
              <div className="text-center">
                <h2 className="mb-4 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
                  Ready to Modernize Your Agency?
                </h2>
                <p className="mb-8 text-[var(--foreground-muted)]">
                  Let&apos;s have a conversation about your agency&apos;s challenges and goals. No pressure, no commitment — just a friendly chat to see if we can help.
                </p>
                
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <a
                    href="mailto:support@metropointtech.com?subject=Services%20Inquiry%20-%20Insurance%20Agency"
                    className="btn-gold inline-flex items-center gap-2 px-8 py-4 text-base"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Email Us
                  </a>
                  <a
                    href="tel:+12395551234"
                    className="btn-secondary inline-flex items-center gap-2 px-8 py-4 text-base"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    Call to Chat
                  </a>
                </div>
                
                <p className="mt-8 text-sm text-[var(--foreground-subtle)]">
                  Or try our <Link href="/login" className="font-medium text-[var(--accent-primary)] hover:underline">Agent Commission Tracker</Link> — free for 14 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--background-secondary)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <Image
                src="/act-logo.png"
                alt="Agent Commission Tracker"
                width={32}
                height={32}
              />
              <span className="font-semibold text-[var(--foreground)]">Agent Commission Tracker</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[var(--foreground-muted)]">
              <Link href="/services" className="hover:text-[var(--foreground)]">Services</Link>
              <Link href="/login" className="hover:text-[var(--foreground)]">Sign In</Link>
              <Link href="/signup" className="hover:text-[var(--foreground)]">Free Trial</Link>
            </div>
          </div>
          <div className="mt-8 border-t border-[var(--border-color)] pt-8 text-center text-xs text-[var(--foreground-muted)]">
            <p>© 2026 Metro Point Technology LLC. All rights reserved.</p>
            <p className="mt-1">Agent Commission Tracker™ is a trademark of Metro Point Technology LLC.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
