export default function HelpPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] shadow-lg">
          <span className="text-3xl">❓</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-1">Help Center</h2>
          <p className="text-[var(--foreground-muted)] flex items-center gap-2">
            <span className="text-lg">📚</span>
            Guides and best practices for importing statements, reconciliation, contacts, and reporting
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <details className="group card hover:scale-[1.01] transition-transform">
          <summary className="flex cursor-pointer list-none items-center justify-between text-xl font-bold text-[var(--foreground)] mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] shadow-md">
                <span className="text-lg">🚀</span>
              </div>
              Getting Started
            </div>
            <span className="ml-4 text-[var(--foreground-muted)] transition group-open:rotate-180">▼</span>
          </summary>
          <div className="mt-4 space-y-4 text-sm text-[var(--foreground)]">
            <p>
              Start by setting up your key data sources so your dashboard metrics and
              reports are accurate from day one.
            </p>
            <ol className="space-y-2">
              <li>1. Add your Carriers and MGAs in Contacts.</li>
              <li>2. Import your policy and commission statements.</li>
              <li>3. Review dashboard totals and fix any mapping issues.</li>
              <li>4. Run reconciliation to match statement items to policies.</li>
            </ol>
            <div className="rounded-xl bg-gradient-to-br from-[var(--background)] to-[var(--background-secondary)] border-2 border-[var(--border-color)] p-4 shadow-sm">
              <p className="font-bold text-[var(--accent-primary)] flex items-center gap-2">
                <span className="text-lg">💡</span>
                Tip
              </p>
              <p className="text-[var(--foreground-muted)] mt-1">
                Keep naming consistent across statements and contacts to speed up
                automatic matching.
              </p>
            </div>
          </div>
        </details>

        <details className="group card hover:scale-[1.01] transition-transform">
          <summary className="flex cursor-pointer list-none items-center justify-between text-xl font-bold text-[var(--foreground)] mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-secondary-hover)] shadow-md">
                <span className="text-lg">📤</span>
              </div>
              How to Import Statements
            </div>
            <span className="ml-4 text-[var(--foreground-muted)] transition group-open:rotate-180">▼</span>
          </summary>
          <div className="mt-4 space-y-4 text-sm text-[var(--foreground)]">
            <p>
              Import statements from CSV or Excel. The system will guide you through
              column mapping and validation before writing to the database.
            </p>
            <ol className="space-y-2">
              <li>1. Go to Dashboard &gt; Import.</li>
              <li>2. Upload your file (CSV, XLSX, XLS, or PDF).</li>
              <li>3. Confirm column mapping for required fields.</li>
              <li>4. Review validation results and fix any errors.</li>
              <li>5. Import valid rows.</li>
            </ol>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="font-medium text-slate-900">Best Practices</p>
              <ul className="mt-2 space-y-1">
                <li>- Use a single header row with consistent column names.</li>
                <li>- Keep policy numbers and dates in a consistent format.</li>
                <li>- Avoid merged cells and extra summary rows.</li>
              </ul>
            </div>
          </div>
        </details>

        <details className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold text-slate-900">
            Understanding Reconciliation
            <span className="ml-4 text-slate-400 transition group-open:rotate-180">v</span>
          </summary>
          <div className="mt-4 space-y-4 text-sm text-slate-700">
            <p>
              Reconciliation matches statement transactions to existing policies so you
              can verify commissions, detect mismatches, and post adjustments.
            </p>
            <ol className="space-y-2">
              <li>1. Upload a carrier or MGA statement.</li>
              <li>2. Review matched and unmatched items.</li>
              <li>3. Resolve exceptions by updating mapping or adding a policy.</li>
              <li>4. Post reconciliation entries to keep an audit trail.</li>
            </ol>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="font-medium text-slate-900">Tip</p>
              <p>
                Reconciliation never edits original transactions. It creates new entries
                to preserve historical accuracy.
              </p>
            </div>
          </div>
        </details>

        <details className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold text-slate-900">
            Managing Contacts (Carriers, MGAs)
            <span className="ml-4 text-slate-400 transition group-open:rotate-180">v</span>
          </summary>
          <div className="mt-4 space-y-4 text-sm text-slate-700">
            <p>
              Keep carrier and MGA contact records up to date to improve matching and
              simplify reporting.
            </p>
            <ul className="space-y-2">
              <li>- Add contact names, emails, and phone numbers.</li>
              <li>- Standardize naming to match your statements.</li>
              <li>- Track primary points of contact for quick follow-up.</li>
            </ul>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="font-medium text-slate-900">Best Practices</p>
              <p>
                If a carrier appears under multiple name variants, pick one standard
                name and use it across imports and contacts.
              </p>
            </div>
          </div>
        </details>

        <details className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold text-slate-900">
            Reading Reports
            <span className="ml-4 text-slate-400 transition group-open:rotate-180">v</span>
          </summary>
          <div className="mt-4 space-y-4 text-sm text-slate-700">
            <p>
              Reports summarize commission performance by date range, carrier, policy
              type, or transaction type.
            </p>
            <ul className="space-y-2">
              <li>- Use filters to focus on the period you need.</li>
              <li>- Export to CSV or Excel for sharing or audit prep.</li>
              <li>- Review the Policy Revenue Ledger for transaction detail.</li>
            </ul>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="font-medium text-slate-900">Tip</p>
              <p>
                Compare report totals to reconciled statement totals to spot variance
                early.
              </p>
            </div>
          </div>
        </details>

        <details className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-semibold text-slate-900">
            FAQ
            <span className="ml-4 text-slate-400 transition group-open:rotate-180">v</span>
          </summary>
          <div className="mt-4 space-y-4 text-sm text-slate-700">
            <div>
              <p className="font-medium text-slate-900">
                Why do some rows fail during import?
              </p>
              <p>
                Missing required fields, invalid dates, or unmatched column mappings
                usually cause failures. Fix the source data or update the mapping and
                re-import.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900">
                How are commissions calculated?
              </p>
              <p>
                Agency commission is based on premium times gross commission percent.
                Agent commission uses the transaction type rate (NEW, RWL, END, and
                more).
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900">
                Can I undo a reconciliation?
              </p>
              <p>
                Reconciliation creates new entries instead of editing originals. If a
                match is incorrect, create a correcting entry to maintain a clear audit
                trail.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900">
                Why do I see duplicate carrier names?
              </p>
              <p>
                Duplicates often come from inconsistent naming in statements. Standardize
                the carrier or MGA name in Contacts and use the same name for imports.
              </p>
            </div>
          </div>
        </details>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Contact Support</h3>
        <p className="mt-2 text-sm text-slate-600">
          Need help with a specific issue? Email our support team and include your
          statement file name and a brief description of the problem.
        </p>
        <a
          className="mt-4 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          href="mailto:support@metropointtech.com"
        >
          Email Support
        </a>
      </div>
      <footer className="mt-12 border-t-2 border-[var(--border-color)] bg-gradient-to-r from-[var(--background-secondary)] to-[var(--background)] py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-2xl">🏢</span>
          <p className="font-bold text-[var(--accent-primary)]">Metro Point Technology</p>
        </div>
        <p className="text-xs text-[var(--foreground-muted)] mb-1">
          📞 <a href="tel:+12394267058" className="hover:text-[var(--accent-primary)] transition-colors">(239) 426-7058</a> | ✉️ <a href="mailto:Support@MetroPointTech.com" className="hover:text-[var(--accent-primary)] transition-colors">Support@MetroPointTech.com</a>
        </p>
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