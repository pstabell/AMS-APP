import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Privacy Policy | Agent Commission Tracker",
  description: "Privacy Policy for Agent Commission Tracker by Metro Point Technology LLC.",
};

export default function PrivacyPage() {
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

      {/* Hero Band */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-8 md:py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
          <p className="mt-2 text-sm text-white/70">Effective Date: March 25, 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-sm leading-relaxed space-y-6 text-[var(--foreground-muted)]">

          <p>
            <strong className="text-[var(--foreground)]">Company:</strong> Metro Point Technology LLC, also referred to as MPT, we, us, or our<br />
            <strong className="text-[var(--foreground)]">Product:</strong> Agent Commission Tracker<br />
            <strong className="text-[var(--foreground)]">Website:</strong> agentcommissiontracker.com<br />
            <strong className="text-[var(--foreground)]">Contact Email:</strong> support@metropointtech.com
          </p>

          <p>This Privacy Policy explains how Metro Point Technology LLC collects, uses, stores, shares, and protects personal information when people use Agent Commission Tracker, related websites, and related business services.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">1. Scope</h2>
          <p>This policy applies to Agent Commission Tracker and related web properties, account registration and administration, customer support interactions, sales and onboarding communications, billing activity, and information submitted by agency staff, business users, prospects, and website visitors.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">2. Information We Collect</h2>
          <p>We may collect information users provide directly, including name, business name, email address, phone number, job title, business address, login credentials, support messages, uploaded content, and billing or transaction information.</p>
          <p>We may collect information automatically, including IP address, browser type, device information, operating system, pages viewed, in-app actions, timestamps, logs, and cookie or session data.</p>
          <p>Depending on customer use of the service, customer-submitted data may include personal information relating to employees, clients, leads, vendors, policyholders, or other business contacts.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">3. How We Use Information</h2>
          <p>We use personal information to provide, operate, maintain, secure, and improve Agent Commission Tracker, create and manage accounts, authenticate users, process transactions, send billing notices, respond to support requests, communicate administrative and security updates, monitor reliability and performance, prevent fraud and misuse, comply with legal and regulatory obligations, and enforce our agreements.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">4. Legal Bases for Processing</h2>
          <p>Where applicable, we process personal information because processing is necessary to perform a contract, because the user or customer provided consent, because we have legitimate business interests in operating and securing the service, or because processing is necessary to comply with legal obligations.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">5. How We Share Information</h2>
          <p>We do not sell personal information.</p>
          <p>We may share personal information with service providers and vendors that help us host, operate, support, secure, or improve the service, with payment processors and business operations providers, with professional advisors including legal, accounting, compliance, and insurance advisors, with regulators or law enforcement when required by law or needed to protect rights, safety, or property, and with successors in connection with a merger, acquisition, financing, restructuring, or asset sale.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">6. Customer Data Role</h2>
          <p>If a customer uses Agent Commission Tracker to store or process personal information relating to that customer&apos;s own clients, users, employees, or contacts, MPT generally acts as a service provider or processor for that customer data. In those cases, the customer is responsible for providing notices, obtaining consents where required, and determining lawful use of the data.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">7. Cookies and Similar Technologies</h2>
          <p>We may use cookies, local storage, analytics tools, and similar technologies to keep users signed in, remember preferences, analyze usage, and improve performance and security. Users may control cookies through browser settings, but disabling them may affect service functionality.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">8. Data Retention</h2>
          <p>We retain personal information for as long as reasonably necessary to provide the service, maintain business and financial records, resolve disputes, enforce agreements, investigate fraud or misuse, satisfy legal, regulatory, tax, accounting, insurance, and audit obligations, and protect the security and integrity of the service.</p>
          <p>Customer workspace data may remain available for export for up to 30 days after account termination unless a shorter or longer period applies under a written agreement or a legal hold, fraud review, payment dispute, or regulatory obligation requires different handling. After the applicable post-termination period, customer content will be deleted or de-identified according to our retention schedule, except where continued retention is reasonably necessary for the obligations described above.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">9. Data Security</h2>
          <p>We use reasonable administrative, technical, and organizational safeguards designed to protect personal information against unauthorized access, loss, misuse, alteration, and disclosure. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">10. User Rights</h2>
          <p>Depending on the user&apos;s jurisdiction, individuals may have rights to request access to personal information, request correction of inaccurate information, request deletion subject to legal and contractual limitations, object to or restrict certain processing, request portability where applicable, and withdraw consent where processing is based on consent. We may need to verify identity before acting on a request.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">11. Children&apos;s Privacy</h2>
          <p>Agent Commission Tracker is intended for business use and is not directed to children under 13. We do not knowingly collect personal information directly from children under 13 through the service.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">12. International Transfers</h2>
          <p>If personal information is processed outside the user&apos;s state, province, or country, we will take reasonable steps to ensure appropriate protections consistent with applicable law.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">13. Third-Party Services</h2>
          <p>The service may integrate with or link to third-party services. We are not responsible for the privacy practices of third parties, and users should review those third-party policies separately.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">14. Insurance and Professional Use Disclaimer</h2>
          <p>Agent Commission Tracker is internal agency software intended to help agencies organize operational information. It is not a licensed insurance producer, broker, adjuster, legal service, or financial advisory service. Use of the platform does not replace legal, regulatory, compliance, or licensed professional review.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">15. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. If we make material changes, we will update the effective date and may provide additional notice where appropriate.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">16. Contact Information</h2>
          <p>
            Metro Point Technology LLC<br />
            Email: support@metropointtech.com<br />
            Mailing Address: Cape Coral, Florida
          </p>

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
