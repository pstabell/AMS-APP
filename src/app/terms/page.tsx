import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/login" className="text-orange-500 hover:underline text-sm mb-6 inline-block">&larr; Back to Login</Link>
        <h1 className="text-3xl font-bold text-slate-800 mb-1">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-1">Metro Point Technology LLC</p>
        <p className="text-sm text-slate-500 mb-8">Effective Date: January 15, 2025 &middot; Last Updated: January 15, 2025</p>

        <div className="max-w-none text-sm leading-relaxed space-y-6 text-slate-700">

          <h2 className="text-lg font-semibold text-slate-800">1. Agreement to Terms</h2>
          <p>By accessing or using Metro Point Technology LLC&apos;s (&quot;Metro Point,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) Software as a Service products, including AMS-App and related services (the &quot;Services&quot;), you (&quot;Customer,&quot; &quot;you,&quot; or &quot;your&quot;) agree to be bound by these Terms of Service (&quot;Terms&quot;). If you are entering into these Terms on behalf of a company or other legal entity, you represent that you have the authority to bind such entity to these Terms.</p>
          <p><strong>Contact Information:</strong><br />Email: Support@MetroPointTech.com<br />Address: Southwest Florida, United States</p>

          <h2 className="text-lg font-semibold text-slate-800">2. Description of Services</h2>
          <p>Metro Point provides cloud-based software solutions designed for insurance agencies and related businesses, including:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>AMS-App:</strong> Insurance agency management system for policy tracking, commission management, and client relationship management</li>
            <li><strong>Related Tools:</strong> Additional modules, integrations, and supporting services as made available</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-800">3. Subscription and Payment Terms</h2>
          <h3 className="text-base font-medium text-slate-700">3.1 Subscription Plans</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Plan Types:</strong> Various subscription tiers with different features and usage limits</li>
            <li><strong>Billing Cycles:</strong> Monthly or annual billing as selected during signup</li>
            <li><strong>Plan Changes:</strong> You may upgrade or downgrade your plan with changes effective on the next billing cycle</li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">3.2 Fees and Payment</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Subscription Fees:</strong> Due in advance based on your selected billing cycle</li>
            <li><strong>Payment Methods:</strong> Credit card, ACH transfer, or other approved payment methods</li>
            <li><strong>Automatic Renewal:</strong> Subscriptions automatically renew unless cancelled</li>
            <li><strong>Late Fees:</strong> A late fee of 1.5% per month may be charged on overdue amounts</li>
            <li><strong>Taxes:</strong> You are responsible for applicable taxes, which may be added to your bill</li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">3.3 Free Trials and Promotions</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Trial Terms:</strong> Free trial periods, if offered, are subject to specific terms communicated at signup</li>
            <li><strong>Trial Limitations:</strong> May include feature restrictions or data limits</li>
            <li><strong>Conversion:</strong> Trials automatically convert to paid subscriptions unless cancelled</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-800">4. Acceptable Use</h2>
          <h3 className="text-base font-medium text-slate-700">4.1 Permitted Uses</h3>
          <p>You may use our Services to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Manage your insurance agency operations and client relationships</li>
            <li>Store and process business data related to your operations</li>
            <li>Access and utilize features as provided in your subscription plan</li>
            <li>Integrate with approved third-party services</li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">4.2 Prohibited Uses</h3>
          <p>You may NOT use our Services to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on intellectual property rights of others</li>
            <li>Upload or transmit malicious code, viruses, or harmful content</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Reverse engineer, decompile, or attempt to extract source code</li>
            <li>Resell, redistribute, or sublicense access to others (except as permitted)</li>
            <li>Use automated systems to access the Services without permission</li>
            <li>Store or process illegal content or engage in fraudulent activities</li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">4.3 Data Accuracy</h3>
          <p>You are responsible for the accuracy and legality of all data you input, store, or process through our Services.</p>

          <h2 className="text-lg font-semibold text-slate-800">5. User Accounts and Security</h2>
          <h3 className="text-base font-medium text-slate-700">5.1 Account Registration</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>You must provide accurate, current, and complete information during registration</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
            <li>You must notify us immediately of any unauthorized use of your account</li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">5.2 User Responsibilities</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use strong passwords and enable multi-factor authentication when available</li>
            <li>Restrict access to authorized users only</li>
            <li>Monitor account activity and report suspicious behavior</li>
            <li>Comply with all applicable data protection and privacy laws</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-800">6. Data and Privacy</h2>
          <h3 className="text-base font-medium text-slate-700">6.1 Your Data</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Ownership:</strong> You retain ownership of all data you upload or generate using our Services</li>
            <li><strong>License:</strong> You grant us a limited license to process your data as necessary to provide the Services</li>
            <li><strong>Privacy:</strong> Our collection and use of your personal information is governed by our <Link href="/privacy" className="text-orange-500 hover:underline">Privacy Policy</Link></li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">6.2 Data Security</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>We implement industry-standard security measures to protect your data</li>
            <li>We regularly backup your data and maintain disaster recovery procedures</li>
            <li>You acknowledge that no system is 100% secure and use the Services at your own risk</li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">6.3 Data Export and Portability</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>You may export your data in standard formats as provided by our export tools</li>
            <li>Upon request, we will assist with data migration to other systems (fees may apply)</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-800">7. Intellectual Property</h2>
          <h3 className="text-base font-medium text-slate-700">7.1 Our IP Rights</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Metro Point retains all rights, title, and interest in the Services, including all intellectual property rights</li>
            <li>Our trademarks, logos, and brand elements may not be used without written permission</li>
            <li>These Terms do not grant you any license to our intellectual property except as necessary to use the Services</li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">7.2 Customer IP Rights</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>You retain ownership of your pre-existing intellectual property</li>
            <li>Any feedback, suggestions, or improvements you provide may be used by us without restriction</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-800">8. Service Level and Availability</h2>
          <h3 className="text-base font-medium text-slate-700">8.1 Uptime Commitment</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>We strive to maintain 99.9% uptime for our Services during each calendar month</li>
            <li>Scheduled maintenance windows will be announced in advance when possible</li>
            <li>Downtime excludes maintenance, force majeure events, and issues outside our control</li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">8.2 Support</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Business Hours:</strong> Monday&ndash;Friday, 9 AM &ndash; 5 PM Eastern Time</li>
            <li><strong>Response Times:</strong> We aim to respond to support requests within 24 hours during business days</li>
            <li><strong>Support Channels:</strong> Email, in-app messaging, and knowledge base resources</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-800">9. Limitation of Liability</h2>
          <h3 className="text-base font-medium text-slate-700">9.1 Service Disclaimer</h3>
          <p className="uppercase text-xs">THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
          <h3 className="text-base font-medium text-slate-700">9.2 Liability Limitations</h3>
          <p className="uppercase text-xs">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Our total liability for any claims related to these Terms or the Services shall not exceed the amount you paid us in the twelve (12) months preceding the claim</li>
            <li>We shall not be liable for indirect, incidental, consequential, special, or punitive damages</li>
            <li>We are not responsible for data loss, business interruption, or lost profits</li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">9.3 Indemnification</h3>
          <p>You agree to indemnify and hold harmless Metro Point from any claims, damages, or expenses arising from:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Your use of the Services in violation of these Terms</li>
            <li>Your violation of applicable laws or regulations</li>
            <li>Infringement of third-party rights by your content or data</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-800">10. Termination</h2>
          <h3 className="text-base font-medium text-slate-700">10.1 Termination by You</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>You may cancel your subscription at any time through your account settings or by contacting support</li>
            <li>Cancellation takes effect at the end of your current billing period</li>
            <li>No refunds are provided for unused portions of prepaid subscriptions</li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">10.2 Termination by Us</h3>
          <p>We may terminate your account:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>For breach of these Terms (with 30 days&apos; notice to cure, if curable)</li>
            <li>For non-payment of fees (after 30 days past due)</li>
            <li>If required by law or to protect our rights or those of others</li>
            <li>At our discretion with 30 days&apos; advance notice</li>
          </ul>
          <h3 className="text-base font-medium text-slate-700">10.3 Effects of Termination</h3>
          <p>Upon termination:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Your access to the Services will be disabled</li>
            <li>Your data will be made available for export for 30 days</li>
            <li>After 30 days, your data may be permanently deleted</li>
            <li>All payment obligations accrued prior to termination remain due</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-800">11. Dispute Resolution</h2>
          <h3 className="text-base font-medium text-slate-700">11.1 Informal Resolution</h3>
          <p>Before initiating formal proceedings, parties agree to attempt good faith resolution through direct negotiation for at least 30 days.</p>
          <h3 className="text-base font-medium text-slate-700">11.2 Binding Arbitration</h3>
          <p>Any disputes arising from these Terms shall be resolved through binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules. The arbitration shall be conducted in Florida, and Florida law shall govern.</p>
          <h3 className="text-base font-medium text-slate-700">11.3 Class Action Waiver</h3>
          <p>You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.</p>
          <h3 className="text-base font-medium text-slate-700">11.4 Exceptions</h3>
          <p>The following may be pursued in court:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Claims for intellectual property infringement</li>
            <li>Requests for injunctive relief</li>
            <li>Small claims court actions (under applicable limits)</li>
          </ul>

          <h2 className="text-lg font-semibold text-slate-800">12. Modifications to Terms</h2>
          <h3 className="text-base font-medium text-slate-700">12.1 Updates</h3>
          <p>We may modify these Terms at any time by posting updated Terms on our website, sending notice to your registered email address, or providing notice through the Services.</p>
          <h3 className="text-base font-medium text-slate-700">12.2 Acceptance</h3>
          <p>Continued use of the Services after notice of changes constitutes acceptance of the modified Terms. If you do not agree to the changes, you must stop using the Services.</p>
          <h3 className="text-base font-medium text-slate-700">12.3 Material Changes</h3>
          <p>For material changes that significantly affect your rights, we will provide at least 30 days&apos; advance notice.</p>

          <h2 className="text-lg font-semibold text-slate-800">13. General Provisions</h2>
          <h3 className="text-base font-medium text-slate-700">13.1 Governing Law</h3>
          <p>These Terms are governed by the laws of the State of Florida, without regard to conflict of law principles.</p>
          <h3 className="text-base font-medium text-slate-700">13.2 Severability</h3>
          <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.</p>
          <h3 className="text-base font-medium text-slate-700">13.3 Entire Agreement</h3>
          <p>These Terms, together with our <Link href="/privacy" className="text-orange-500 hover:underline">Privacy Policy</Link> and any order forms, constitute the entire agreement between the parties and supersede all prior agreements.</p>
          <h3 className="text-base font-medium text-slate-700">13.4 No Waiver</h3>
          <p>Our failure to enforce any provision of these Terms does not constitute a waiver of our right to enforce it later.</p>
          <h3 className="text-base font-medium text-slate-700">13.5 Assignment</h3>
          <p>You may not assign these Terms without our written consent. We may assign these Terms without restriction.</p>
          <h3 className="text-base font-medium text-slate-700">13.6 Force Majeure</h3>
          <p>Neither party will be liable for any failure or delay in performance due to circumstances beyond their reasonable control, including natural disasters, government actions, or network outages.</p>

          <h2 className="text-lg font-semibold text-slate-800">14. Contact Information</h2>
          <p>Questions about these Terms should be directed to:</p>
          <p><strong>Metro Point Technology LLC</strong><br />Email: Support@MetroPointTech.com<br />Subject Line: &quot;Terms of Service Inquiry&quot;</p>
          <p>We will respond to inquiries within 30 days.</p>

          <hr className="border-slate-200" />
          <p><strong>Acknowledgment:</strong> By using our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
          <p className="italic text-slate-500">These Terms are effective as of the date listed above and apply to all users of Metro Point Technology&apos;s Services.</p>
        </div>

        <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
          <p>&copy; 2026 Metro Point Technology LLC. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
