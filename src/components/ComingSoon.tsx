export type ComingSoonProps = {
  title: string;
  description?: string;
};

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-color-strong)] bg-[var(--background-secondary)] p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">
        {title}
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">Coming Soon</h2>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
        {description ?? "We're building this section now. Check back soon."}
      </p>
    </div>
  );
}
