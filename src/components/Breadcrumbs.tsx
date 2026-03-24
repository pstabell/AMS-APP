"use client";

import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
  icon?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

/**
 * Breadcrumb navigation component for drill-down hierarchy
 * Shows the path: Customers → Customer Detail → Policy Term → ...
 */
export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-slate-400 select-none">›</span>
              )}
              
              {isLast ? (
                <span className="flex items-center gap-1.5 font-semibold text-[var(--foreground)]">
                  {item.icon && <span>{item.icon}</span>}
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 text-[var(--foreground-muted)] hover:text-[var(--accent-primary)] transition-colors"
                >
                  {item.icon && <span>{item.icon}</span>}
                  {item.label}
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 text-[var(--foreground-muted)]">
                  {item.icon && <span>{item.icon}</span>}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
