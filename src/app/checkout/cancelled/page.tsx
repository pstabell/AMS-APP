import Link from "next/link";

export default function CheckoutCancelledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Checkout Cancelled</h1>
        <p className="text-slate-600">No worries — you weren&apos;t charged. You can start your free trial anytime.</p>
        <Link href="/login" className="inline-block rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
