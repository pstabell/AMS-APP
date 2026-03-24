import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/login" className="text-orange-500 hover:underline text-sm mb-6 inline-block">&larr; Back to Login</Link>
        <h1 className="text-3xl font-bold text-slate-800 mb-1">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-1">Metro Point Technology LLC</p>
        <p className="text-sm text-slate-500 mb-8">Effective Date: January 15, 2025 &middot; Last Updated: January 15, 2025</p>

        <div className="max-w-none text-sm leading-relaxed space-y-6 text-slate-700">

          <h2 className="text-lg font-semibold text-slate-800">1. Introduction</h2>
          <p>Metro Point Technology LLC (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Software as a Service (SaaS) products, including AMS-App (insurance agency management system) and related services (collectively, the &quot;Services&quot;).</p>
          <p><strong>Contact Information:</strong><br />Email: Support@MetroPointTech.com<br />Address: Southwest Florida, United States</p>

          <h2 className="text-lg font-semibold text-slate-800">2. Information We Collect</h2>
          <h3 className="text-base font-medium text-slate-700">2.1 Information You Provide Directly</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Account Information:</strong> Name, email address, company name, phone number, billing address</li>
            <li><strong>Profile Information:</strong> User preferences, settings, and profile details</li>
            <li><strong>Business Data:</strong> Information you upload, store, or process through our Services, including client records, policy information, commission data, and other business-related content</li>
            <li><strong>Communications:</strong> Messages sent through our support channels, feedback forms, or customer service interactions</li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">2.2 Information Collected Automatically</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Usage Data:</strong> How you interact with our Services, features used, time spent, click patterns</li>
            <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
            <li><strong>Log Data:</strong> Server logs, error reports, API calls, system performance metrics</li>
            <li><strong>Location Data:</strong> General geographic location based on IP address (not precise location tracking)</li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">2.3 Cookies and Similar Technologies</h3>
          <p>We use cookies, web beacons, and similar technologies to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Maintain your session and authentication</li>
            <li>Remember your preferences and settings</li>
            <li>Analyze usage patterns and improve our Services</li>
            <li>Provide security features and prevent fraud</li>
          </ul>
          <p><strong>Cookie Types:</strong></p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Essential Cookies:</strong> Required for basic functionality</li>
            <li><strong>Performance Cookies:</strong> Help us understand how you use our Services</li>
            <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-800">3. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Provide Services:</strong> Deliver, maintain, and improve our SaaS products</li>
            <li><strong>Account Management:</strong> Create and manage your account, process subscriptions</li>
            <li><strong>Customer Support:</strong> Respond to inquiries, provide technical assistance</li>
            <li><strong>Communication:</strong> Send service updates, security alerts, administrative messages</li>
            <li><strong>Analytics:</strong> Analyze usage patterns to improve our Services</li>
            <li><strong>Security:</strong> Protect against fraud, unauthorized access, and security threats</li>
            <li><strong>Legal Compliance:</strong> Comply with applicable laws and regulations</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-800">4. Data Storage and Security</h2>
          <h3 className="text-base font-medium text-slate-700">4.1 Data Storage</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Cloud Infrastructure:</strong> We use industry-standard cloud providers with robust security measures</li>
            <li><strong>Data Centers:</strong> Located in the United States with SOC 2 compliance</li>
            <li><strong>Encryption:</strong> Data is encrypted both in transit (TLS 1.2+) and at rest (AES-256)</li>
            <li><strong>Backups:</strong> Regular automated backups with secure storage and retention policies</li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">4.2 Security Measures</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Multi-factor authentication options</li>
            <li>Regular security audits and penetration testing</li>
            <li>Employee access controls and training</li>
            <li>Incident response procedures</li>
            <li>Compliance with industry security standards</li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">4.3 Data Retention</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Account Data:</strong> Retained while your account is active</li>
            <li><strong>Business Data:</strong> Retained according to your subscription terms</li>
            <li><strong>Log Data:</strong> Typically retained for 12 months for security and analytics purposes</li>
            <li><strong>Deleted Data:</strong> Securely deleted within 30 days of account termination (unless required by law)</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-800">5. Information Sharing and Disclosure</h2>
          <h3 className="text-base font-medium text-slate-700">5.1 We Do Not Sell Your Personal Information</h3>
          <p>Metro Point Technology does not sell, rent, or trade your personal information to third parties for monetary consideration.</p>
          <h3 className="text-base font-medium text-slate-700">5.2 Limited Sharing Scenarios</h3>
          <p>We may share information only in the following circumstances:</p>
          <p><strong>Service Providers:</strong> With trusted third-party vendors who assist in providing our Services:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Cloud hosting providers</li>
            <li>Payment processors (Stripe)</li>
            <li>Email service providers</li>
            <li>Analytics and monitoring tools</li>
          </ul>
          <p><strong>Legal Requirements:</strong> When required by law, regulation, or court order:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Compliance with subpoenas or legal process</li>
            <li>Protection of our rights and property</li>
            <li>Prevention of fraud or security threats</li>
            <li>Public safety requirements</li>
          </ul>
          <p><strong>Business Transfers:</strong> In the event of merger, acquisition, or sale of assets (with advance notice to users)</p>

          <h2 className="text-lg font-semibold text-slate-800">6. Your Rights and Choices</h2>
          <h3 className="text-base font-medium text-slate-700">6.1 Access and Control</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Account Access:</strong> View and update your account information through our Services</li>
            <li><strong>Data Export:</strong> Request a copy of your data in a portable format</li>
            <li><strong>Data Correction:</strong> Update or correct inaccurate personal information</li>
            <li><strong>Data Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">6.2 Communication Preferences</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Marketing Emails:</strong> Opt-out of promotional communications (service emails may continue)</li>
            <li><strong>Notifications:</strong> Control in-app and email notifications through your settings</li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">6.3 Cookie Controls</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Browser Settings:</strong> Disable cookies through your browser (may affect functionality)</li>
            <li><strong>Opt-Out:</strong> Use browser-based opt-out tools for analytics cookies</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-800">7. Third-Party Services</h2>
          <p>Our Services may integrate with third-party applications and services. This Privacy Policy does not apply to third-party services. We encourage you to review their privacy policies before connecting or sharing information.</p>
          <p><strong>Common Integrations:</strong></p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Email providers (Outlook, Gmail)</li>
            <li>Insurance carrier systems</li>
            <li>Accounting software</li>
            <li>CRM platforms</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-800">8. International Users</h2>
          <p>Our Services are primarily designed for users in the United States. If you access our Services from outside the U.S., your information may be transferred to and processed in the United States, where our servers are located and our central database is operated.</p>

          <h2 className="text-lg font-semibold text-slate-800">9. Children&apos;s Privacy</h2>
          <p>Our Services are not intended for individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we discover that we have collected information from a child under 13, we will promptly delete such information.</p>

          <h2 className="text-lg font-semibold text-slate-800">10. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy periodically to reflect changes in our practices, technology, or legal requirements. We will:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Post the updated policy on our website</li>
            <li>Notify you of material changes via email or through our Services</li>
            <li>Update the &quot;Last Updated&quot; date at the top of this policy</li>
          </ul>
          <p>Continued use of our Services after changes constitute acceptance of the updated policy.</p>

          <h2 className="text-lg font-semibold text-slate-800">11. California Privacy Rights</h2>
          <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Right to know what personal information we collect and how it&apos;s used</li>
            <li>Right to delete personal information (with certain exceptions)</li>
            <li>Right to opt-out of the sale of personal information (we don&apos;t sell your information)</li>
            <li>Right to non-discrimination for exercising your privacy rights</li>
          </ul>
          <p>To exercise these rights, contact us at Support@MetroPointTech.com.</p>

          <h2 className="text-lg font-semibold text-slate-800">12. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or our privacy practices, please contact us:</p>
          <p><strong>Metro Point Technology LLC</strong><br />Email: Support@MetroPointTech.com<br />Subject Line: &quot;Privacy Policy Inquiry&quot;</p>
          <p>We will respond to privacy-related inquiries within 30 days.</p>

          <hr className="border-slate-200" />
          <p className="italic text-slate-500">This Privacy Policy is effective as of the date listed above and applies to all users of Metro Point Technology&apos;s Services.</p>
        </div>

        <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
          <p>&copy; 2026 Metro Point Technology LLC. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
