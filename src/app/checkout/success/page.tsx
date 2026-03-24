"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    // The Stripe webhook handles subscription activation in Supabase.
    // By the time the user lands here, the webhook has already fired.
    // We just show the success state and point them to login or signup.
    setStatus("success");
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-slate-600">Confirming your subscription...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-800">Something went wrong</h1>
          <p className="text-slate-600">We couldn&apos;t confirm your checkout session. If you were charged, your subscription will still activate automatically.</p>
          <Link href="/login" className="inline-block rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <div className="max-w-md text-center space-y-6">
        <div className="text-5xl">&#127881;</div>
        <h1 className="text-3xl font-bold text-slate-800">Welcome to Agent Commission Tracker!</h1>
        <p className="text-slate-600">Your 14-day free trial is now active. No charges until the trial ends.</p>
        <div className="space-y-3">
          <p className="text-sm text-slate-500">If you already created an account, log in now. Otherwise, create your account first.</p>
          <div className="flex flex-col gap-3">
            <Link href="/login" className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 text-center">
              Log In
            </Link>
            <Link href="/signup" className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 text-center">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
