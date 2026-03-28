"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AIStatus = {
  aiEnabled: boolean;
  actionsUsedToday: number;
  dailyLimit: number;
  actionsRemaining: number;
  dailyRemaining?: number;
  bucketRemaining?: number;
  plan: string;
};

export default function AIActionsWidget() {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/check-actions")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card-elevated rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-[var(--background-secondary)] rounded w-24 mb-2" />
        <div className="h-6 bg-[var(--background-secondary)] rounded w-16" />
      </div>
    );
  }

  if (!status) return null;

  // No AI plan — show upgrade prompt
  if (!status.aiEnabled) {
    return (
      <div className="card-elevated rounded-xl p-4 border border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
              AI Assistant
            </p>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              Upgrade to Pro for AI reconciliation
            </p>
          </div>
          <Link
            href="/pricing"
            className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
          >
            Upgrade
          </Link>
        </div>
      </div>
    );
  }

  // AI enabled — show usage meter
  const usagePercent = status.dailyLimit > 0
    ? Math.min(100, (status.actionsUsedToday / status.dailyLimit) * 100)
    : 0;

  const isLow = status.dailyRemaining !== undefined && status.dailyRemaining <= 5 && status.dailyRemaining > 0;
  const isExhausted = status.dailyRemaining === 0 && (status.bucketRemaining || 0) === 0;

  const barColor = isExhausted
    ? "bg-[var(--error)]"
    : isLow
    ? "bg-[var(--warning)]"
    : "bg-[var(--success)]";

  return (
    <div className="card-elevated rounded-xl p-4 border border-[var(--border-color)]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
          AI Actions Today
        </p>
        <span className="text-xs text-[var(--foreground-muted)]">
          {status.actionsUsedToday} / {status.dailyLimit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-[var(--background-secondary)] mb-2">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--foreground)]">
          <span className="font-bold">{status.actionsRemaining}</span> remaining
          {(status.bucketRemaining || 0) > 0 && (
            <span className="text-xs text-[var(--foreground-muted)] ml-1">
              ({status.bucketRemaining} from bucket)
            </span>
          )}
        </p>
        {isExhausted && (
          <button
            onClick={async () => {
              const res = await fetch("/api/ai/purchase-bucket", { method: "POST" });
              const data = await res.json();
              if (data.url) window.location.href = data.url;
            }}
            className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
          >
            Buy 600 more
          </button>
        )}
      </div>
    </div>
  );
}
