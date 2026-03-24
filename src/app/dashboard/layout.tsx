"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import FloorSwitcher from "@/components/FloorSwitcher";
import { ADMIN_ONLY_PAGES, FLOOR_LABELS, FLOOR_2_ONLY_PAGES } from "@/lib/roles";
import ThemeToggle from "@/components/ThemeToggle";

type NavLink = { href: string; label: string };

const navLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/customers", label: "Customers" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/policies", label: "All Policy Transactions" },
  { href: "/dashboard/policies/edit", label: "Edit Policy Transactions" },
  { href: "/dashboard/policies/new", label: "Add New Policy Transaction" },
  { href: "/dashboard/policies/search", label: "Search & Filter" },
  { href: "/dashboard/reconciliation", label: "Reconciliation" },
  { href: "/dashboard/admin", label: "Admin Panel" },
  { href: "/dashboard/contacts", label: "Carriers & MGAs" },
  { href: "/dashboard/tools", label: "Tools" },
  { href: "/dashboard/prl", label: "Policy Revenue Ledger" },
  { href: "/dashboard/prl-reports", label: "Policy Revenue Ledger Reports" },
  { href: "/dashboard/renewals", label: "Pending Policy Renewals" },
  { href: "/dashboard/account", label: "Account" },
  { href: "/dashboard/help", label: "Help" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading, currentFloor, switchFloor, canSwitchToFloor2 } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const getVisibleNavLinks = () => {
    return navLinks.filter(link => {
      // Hide admin-only pages when on Floor 1
      if (currentFloor === 1 && ADMIN_ONLY_PAGES.includes(link.href)) {
        return false;
      }
      // Hide Floor 2 only pages when on Floor 1
      if (currentFloor === 1 && FLOOR_2_ONLY_PAGES.includes(link.href)) {
        return false;
      }
      return true;
    });
  };

  const renderNavLink = (href: string, label: string) => {
    // Exact match for /dashboard, prefix match for others
    const isActive = href === "/dashboard" 
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setMobileOpen(false)}
        className={`group relative rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
          isActive
            ? "bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-hover)] text-white shadow-lg transform scale-105"
            : "text-[var(--foreground)] hover:bg-[var(--hover-bg)] hover:text-[var(--accent-primary)] hover:transform hover:scale-102 hover:shadow-md"
        }`}
        style={{
          borderLeft: isActive ? '4px solid var(--highlight-amber)' : '4px solid transparent',
        }}
      >
        <span className="relative z-10">{label}</span>
        {!isActive && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-hover)] opacity-0 transition-opacity duration-300 group-hover:opacity-10"></div>
        )}
      </Link>
    );
  };

  return (
    <div className="fixed inset-0 bg-[var(--background)] text-[var(--foreground)]" data-floor={currentFloor}>
      <div className="mx-auto flex h-full w-full max-w-7xl">
        <aside className="hidden w-64 shrink-0 flex-col p-6 md:flex shadow-lg border-r border-[var(--border-color-strong)] transition-colors duration-300 overflow-y-scroll bg-[var(--background-secondary)]"
               style={{
                 background: 'linear-gradient(180deg, var(--background-secondary) 0%, var(--background) 100%)',
               }}>
          <div className="mb-8 space-y-3 pb-6 border-b-2 border-[var(--border-color)]">
            {/* Shield Logo Header */}
            <div className="flex items-center gap-3 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/act-logo.png"
                alt="Agent Commission Tracker"
                width={64}
                height={64}
                className="drop-shadow-lg"
              />
              <div>
                <p className="text-lg font-bold text-[var(--foreground)] leading-tight">
                  {currentFloor === 2 ? "Agency" : "Agent"}<br />Commission<br />Tracker
                </p>
                <p className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider">
                  {currentFloor === 2 ? FLOOR_LABELS[currentFloor].description : 'Your Personal Commission Tracker'}
                </p>
              </div>
            </div>
            
            <div className="h-1 rounded-full shadow-sm gradient-accent"></div>
          </div>
          
          {/* Floor switcher moved to header bar */}
          
          <nav className="flex flex-1 flex-col gap-3 pr-1">
            {getVisibleNavLinks().map((link) => renderNavLink(link.href, link.label))}
            <div className="mt-auto pt-6 rounded-2xl border-2 border-[var(--accent-primary)] bg-gradient-to-br from-[var(--background)] to-[var(--background-secondary)] p-5 text-sm shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">👤</span>
                <p className="font-semibold text-[var(--foreground)]">Signed in</p>
              </div>
              <p className="text-[var(--foreground-muted)] text-xs break-all">{user?.email ?? "Loading..."}</p>
              <div className="mt-3 h-1 bg-[var(--border-color)] rounded-full overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--highlight-amber)] rounded-full"></div>
              </div>
            </div>
          </nav>
        </aside>

        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <header className="shrink-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b-2 border-[var(--border-color-strong)] bg-[var(--background-secondary)] px-4 py-6 md:px-8 shadow-lg backdrop-blur-sm"
                  style={{
                    background: 'linear-gradient(135deg, var(--background-secondary) 0%, var(--background) 100%)',
                  }}>
            <div className="space-y-2 flex items-center gap-3">
              <div className="flex items-center md:hidden">
                <button aria-label="Open menu" onClick={() => setMobileOpen(true)} className="p-2 rounded-md bg-[var(--accent-primary)] text-white">
                  ☰
                </button>
              </div>
              <span className="text-3xl">{FLOOR_LABELS[currentFloor].icon}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-primary)]">
                  AMS-APP • {FLOOR_LABELS[currentFloor].name}
                </p>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-[var(--foreground)]">Dashboard</h1>
                  <div className={`floor-badge ${currentFloor === 2 ? 'floor-badge-2' : 'floor-badge-1'}`}>
                    Floor {currentFloor}
                  </div>
                </div>
              </div>
            </div>
            {/* Floor Switcher in header — compact version for admin users */}
            {canSwitchToFloor2 && (
              <div 
                onClick={() => switchFloor(currentFloor === 1 ? 2 : 1)}
                className={`
                  hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer
                  transition-all duration-300 hover:scale-105 active:scale-95
                  ${currentFloor === 1 
                    ? 'bg-gradient-to-r from-teal-600 to-teal-500 shadow-[0_4px_20px_rgba(20,184,166,0.3)] hover:shadow-[0_6px_24px_rgba(20,184,166,0.4)]' 
                    : 'bg-gradient-to-r from-violet-600 to-violet-500 shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_24px_rgba(139,92,246,0.4)]'
                  }
                  text-white font-medium text-sm
                `}
              >
                <span className="text-lg">{currentFloor === 1 ? '👤' : '🏢'}</span>
                <span className="font-semibold">Floor {currentFloor}</span>
                <span className="text-xs opacity-80 border-l border-white/20 pl-2 ml-1">▸ {currentFloor === 1 ? '🏢' : '👤'}</span>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="hidden text-right text-sm text-[var(--foreground)] sm:block">
                <p className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <span className="text-green-500">●</span>
                  {user?.email ?? "Loading account..."}
                </p>
                <p className="text-[var(--foreground-muted)] text-xs">
                  {loading ? "Refreshing session..." : "Active session"}
                </p>
              </div>
              <ThemeToggle />
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border-2 border-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-[var(--accent-primary)] transition-all duration-300 hover:bg-[var(--accent-primary)] hover:text-white hover:shadow-lg hover:transform hover:scale-105"
              >
                Logout
              </button>
            </div>
          </header>

          {mobileOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)}></div>
              <div className="absolute left-0 top-0 h-full w-72 bg-[var(--background-secondary)] p-6 shadow-xl border-r border-[var(--border-color-strong)]">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-[var(--accent-primary)] text-white">🛡️</div>
                    <div>
                      <p className="font-bold text-[var(--foreground)]">{currentFloor === 2 ? "Agency" : "Agent"} Commission</p>
                      <p className="text-xs text-[var(--foreground-muted)]">Menu</p>
                    </div>
                  </div>
                  <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="p-2 rounded-md bg-transparent text-[var(--foreground)]">✕</button>
                </div>
                <nav className="flex flex-col gap-2 overflow-y-auto">
                  {getVisibleNavLinks().map((link) => renderNavLink(link.href, link.label))}
                </nav>
              </div>
            </div>
          )}

          <main className="flex-1 overflow-y-scroll px-4 py-8 md:px-8 bg-gradient-to-br from-[var(--background)] to-[var(--background-secondary)]">{children}</main>
        </div>
      </div>
    </div>
  );
}
