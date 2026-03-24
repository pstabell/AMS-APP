"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSent(true);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Check your email</h1>
          <p className="text-sm text-slate-600">
            We&apos;ve sent a password reset link to <strong>{email}</strong>.
            Click the link in the email to reset your password.
          </p>
        </div>
        <div className="text-center text-sm text-slate-600">
          <Link className="font-semibold text-slate-900 hover:text-slate-700" href="/login">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          AMS-APP
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Reset your password</h1>
        <p className="text-sm text-slate-600">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <div className="text-center text-sm text-slate-600">
        Remember your password?{" "}
        <Link className="font-semibold text-slate-900 hover:text-slate-700" href="/login">
          Sign in
        </Link>
      </div>
    </div>
  );
}
