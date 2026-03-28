import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Terms of Service | Agent Commission Tracker",
  description: "Terms of Service for Agent Commission Tracker by Metro Point Technology LLC.",
};

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
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

          <p>These Terms of Service govern access to and use of Agent Commission Tracker and related services provided by Metro Point Technology LLC. By accessing or using the service, the customer or user agrees to these Terms.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">1. Eligibility and Authority</h2>
          <p>You represent that you are at least 18 years old, you have authority to bind yourself or the business entity using the service, and the information you provide is accurate and current.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">2. The Service</h2>
          <p>Agent Commission Tracker is a business software platform made available by MPT. We may update, improve, modify, suspend, or discontinue features from time to time.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">3. Accounts</h2>
          <p>Users must maintain accurate account information, keep credentials confidential, promptly notify MPT of suspected unauthorized access or security incidents, and use the service only as authorized. Customers are responsible for all activity occurring under their accounts unless caused by MPT&apos;s own misconduct.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">4. Acceptable Use</h2>
          <p>You may not use the service to violate any law, regulation, or third-party right, upload or transmit malicious code, spam, or harmful content, attempt unauthorized access to systems, accounts, or data, interfere with service performance or security, reverse engineer, copy, scrape, or exploit the service except as allowed by law or written permission, or use the service to store or process unlawful, infringing, defamatory, or fraudulent material.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">5. Customer Data</h2>
          <p>You retain rights to data you submit to the service, subject to the rights necessary for MPT to host, process, back up, transmit, and display that data to provide the service. You are responsible for the legality, accuracy, and content of customer-submitted data, obtaining required notices, consents, and permissions, and your users&apos; compliance with these Terms.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">6. Privacy</h2>
          <p>Use of the service is also governed by the <Link href="/privacy" className="text-[var(--accent-primary)] hover:underline">Privacy Policy</Link>. If there is a conflict between these Terms and a separately signed customer agreement, the signed agreement controls.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">7. Fees and Payment</h2>
          <p>The standard subscription price for Agent Commission Tracker is 79 dollars per month unless a separate written agreement states otherwise. If the service is provided on a paid basis, fees, billing terms, and renewal terms will be stated at signup, on invoice, or in a written agreement. Amounts due must be paid when required. Overdue amounts may result in suspension or termination after reasonable notice. Fees are non-refundable except as required by law or a written agreement.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">8. Insurance, Legal, and Financial Disclaimer</h2>
          <p>Agent Commission Tracker is for internal agency use only. It is software, not a licensed insurance producer, broker, adjuster, legal service, accounting service, or financial advisory service. MPT does not provide insurance, legal, tax, licensing, regulatory, or financial advice through the service. Customers are solely responsible for confirming that their use of the service, workflows, documents, and business practices comply with applicable insurance, licensing, privacy, and other legal requirements.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">9. Intellectual Property</h2>
          <p>MPT and its licensors retain all rights, title, and interest in and to the service, software, documentation, branding, and related materials, excluding customer data. No ownership rights are transferred by use of the service. MPT grants a limited, non-exclusive, non-transferable, revocable right to use the service during the applicable subscription or authorized access period.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">10. Feedback</h2>
          <p>If you provide suggestions, ideas, or feedback, MPT may use them without restriction or compensation.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">11. Confidentiality</h2>
          <p>Each party may receive confidential information from the other. The receiving party will use the other party&apos;s confidential information only as needed for the business relationship and will protect it using reasonable care. Confidential information does not include information that is or becomes public without breach, was already lawfully known, is received lawfully from a third party without restriction, or is independently developed without use of confidential information.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">12. Security</h2>
          <p>MPT will use reasonable safeguards designed to protect the service and customer data. Customers are responsible for secure endpoint use, internal user management, and prompt reporting of suspicious activity.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">13. Third-Party Services</h2>
          <p>The service may interoperate with third-party products or services. MPT is not responsible for third-party services, and use of them may be governed by separate terms.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">14. Availability and Support</h2>
          <p>MPT will use reasonable efforts to maintain service availability but does not guarantee uninterrupted or error-free operation. Maintenance, outages, third-party failures, and force majeure events may affect availability. Support scope, response times, and service levels, if any, will be governed by separate written commitments.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">15. Disclaimers</h2>
          <p>The service is provided as is and as available except as expressly stated in a written agreement. To the maximum extent permitted by law, MPT disclaims implied warranties, including implied warranties of merchantability, fitness for a particular purpose, non-infringement, and any warranty arising from course of dealing or usage of trade.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">16. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, MPT will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, revenue, data, goodwill, or business interruption. MPT&apos;s total liability arising out of or related to the service will not exceed the amounts paid by the customer to MPT for the service during the twelve months before the event giving rise to the claim. These limits do not apply where prohibited by law.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">17. Indemnification</h2>
          <p>You agree to defend, indemnify, and hold harmless MPT and its officers, employees, and affiliates from claims, losses, damages, liabilities, and costs arising from your misuse of the service, your violation of these Terms, your customer data, or your violation of law or third-party rights.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">18. Suspension and Termination</h2>
          <p>MPT may suspend or terminate access if required by law, necessary to protect the service or other users, there is a material security risk, fees remain unpaid after notice where applicable, or you materially breach these Terms.</p>
          <p>Upon termination, your right to use the service ends. Customer workspace data may remain available for export for up to 30 days after termination unless a written agreement, legal hold, fraud review, payment dispute, security matter, or regulatory obligation requires different handling. Billing, transaction, audit, compliance, tax, accounting, security, and dispute-related records may be retained as long as reasonably necessary to meet legal, operational, and contractual obligations. After the applicable retention period, remaining customer content will be deleted or de-identified according to the retention schedule.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">19. Governing Law</h2>
          <p>These Terms are governed by the laws of the State of Florida, without regard to conflict-of-law principles, unless a written agreement states otherwise.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">20. Dispute Resolution</h2>
          <p>Before filing a formal claim, the parties agree to attempt good-faith resolution by written notice. Any venue, arbitration, or court process may be specified in a separate signed agreement. If no separate agreement applies, disputes shall be brought in the state or federal courts located in Florida, and the parties consent to that jurisdiction and venue.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">21. Changes to the Terms</h2>
          <p>We may update these Terms from time to time. Continued use of the service after updated Terms become effective constitutes acceptance of the revised Terms.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">22. General Terms</h2>
          <p>These Terms, together with any order form, statement of work, or written agreement, form the complete agreement for use of the service unless superseded by a signed contract. If any provision is unenforceable, the remaining provisions remain in effect. Failure to enforce a provision is not a waiver. You may not assign these Terms without MPT&apos;s written consent, except in connection with a permitted business transfer. MPT may assign these Terms in connection with a merger, acquisition, or asset sale.</p>

          <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">23. Contact Information</h2>
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
