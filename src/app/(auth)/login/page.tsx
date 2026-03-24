"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// Simple SVG icons for password visibility toggle
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"login" | "trial">("login");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const result = await login(email, password);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)] px-4">
      <div className="w-full max-w-md space-y-6 p-8 rounded-[var(--border-radius-large)] bg-[var(--background-secondary)] border border-[var(--border-color-strong)] shadow-lg">
        {/* Logo/Branding */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">AMS Dash App</h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">Agency Management System</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-md bg-[var(--background)] p-1 border border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === "login"
                ? "bg-[var(--accent-primary)] text-white shadow-sm"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("trial")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === "trial"
                ? "bg-[var(--accent-primary)] text-white shadow-sm"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Start Free Trial
          </button>
        </div>

        {activeTab === "login" ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Login to Your Account</h2>
              <p className="text-sm text-[var(--foreground-muted)]">
                Use your agency email and password to access the dashboard.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--foreground-muted)]" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--foreground)] bg-[var(--background)] outline-none transition focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--hover-bg)]"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--foreground-muted)]" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-[var(--border-color)] px-3 py-2 pr-10 text-sm text-[var(--foreground)] bg-[var(--background)] outline-none transition focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--hover-bg)]"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-md border border-[var(--error-red)] bg-[var(--active-bg)] px-3 py-2 text-sm text-[var(--error-red)]">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-md bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>

            <div className="text-center">
              <Link 
                className="text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)]" 
                href="/forgot-password"
              >
                Forgot Password?
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Start Your Free Trial</h2>
              <p className="text-sm text-[var(--foreground-muted)]">
                Try AMS Dash App free for 14 days. No credit card required.
              </p>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); router.push("/signup"); }}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--foreground-muted)]" htmlFor="trial-email">
                  Email
                </label>
                <input
                  id="trial-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@agency.com"
                  className="w-full rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--foreground)] bg-[var(--background)] outline-none transition focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--hover-bg)]"
                  required
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-md bg-[var(--accent-secondary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-secondary-hover)]"
              >
                Start Free Trial
              </button>
            </form>

            <p className="text-center text-xs text-[var(--foreground-muted)]">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        )}
      </div>

      <footer className="mt-6 text-center text-xs text-[var(--foreground-muted)]">
        <div className="flex items-center justify-center gap-2">
          <Link href="/services" className="hover:text-[var(--foreground)]">Services</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-[var(--foreground)]">Terms of Service</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-[var(--foreground)]">Privacy Policy</Link>
        </div>
        <p className="mt-2">© 2025 Metro Technology Solutions LLC. All rights reserved.</p>
        <p className="mt-1">AMS Dash App™ is a trademark of Metro Technology Solutions LLC.</p>
      </footer>
    </div>
  );
}
