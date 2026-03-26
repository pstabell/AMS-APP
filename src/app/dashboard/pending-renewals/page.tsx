import ComingSoon from "@/components/ComingSoon";

export default function PendingPolicyRenewalsPage() {
  return (
    <div className="space-y-6">
      <ComingSoon
        title="🔄 Pending Policy Renewals"
        description="Track upcoming renewals and follow-up tasks in one place."
      />
      
      {/* Professional Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-4">
        <div className="mx-auto max-w-md text-center text-xs text-slate-500">
          <div className="flex items-center justify-center gap-2">
            <a href="/terms" className="hover:text-slate-700">Terms of Service</a>
            <span>·</span>
            <a href="/privacy" className="hover:text-slate-700">Privacy Policy</a>
          </div>
          <p className="mt-2">© 2026 Metro Point Technology LLC. All rights reserved.</p>
          <p className="mt-1">Agent Management System™ is a product of Metro Point Technology LLC.</p>
        </div>
      </footer>
    </div>
  );
}
