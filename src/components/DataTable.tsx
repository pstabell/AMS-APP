'use client';

import { useState, useMemo, ReactNode } from 'react';

export type ColumnDef<T> = {
  key: string;
  header: string;
  accessor: (item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
};

type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  pageSize?: number;
  showPagination?: boolean;
  searchTerm?: string;
  onRowClick?: (item: T) => void;
  className?: string;
  rowClassName?: (item: T, index: number) => string;
};

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

export default function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No data available",
  emptyIcon = "📝",
  pageSize = 10,
  showPagination = false,
  searchTerm,
  onRowClick,
  className = "",
  rowClassName
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a: any, b: any) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, showPagination]);

  // Handle sorting
  const handleSort = (key: string) => {
    const column = columns.find(col => col.key === key);
    if (!column?.sortable) return;

    setSortConfig(currentConfig => {
      if (!currentConfig || currentConfig.key !== key) {
        return { key, direction: 'asc' };
      }
      if (currentConfig.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  // Get sort icon
  const getSortIcon = (key: string) => {
    const column = columns.find(col => col.key === key);
    if (!column?.sortable) return null;

    if (!sortConfig || sortConfig.key !== key) {
      return (
        <span className="text-[var(--foreground-subtle)] opacity-50">⇅</span>
      );
    }
    return (
      <span className="text-[var(--accent-primary)]">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Loading skeleton rows
  const LoadingSkeleton = () => (
    <>
      {[...Array(5)].map((_, index) => (
        <tr key={index}>
          {columns.map((column, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <div className="h-4 bg-[var(--background-tertiary)] rounded animate-pulse" 
                   style={{ width: `${60 + Math.random() * 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  // Empty state
  const EmptyState = () => (
    <tr>
      <td className="text-center py-16" colSpan={columns.length}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--background-tertiary)] flex items-center justify-center">
            <span className="text-4xl opacity-60">{emptyIcon}</span>
          </div>
          <div>
            <p className="text-base font-semibold text-[var(--foreground)] mb-1">
              {searchTerm ? `No results for "${searchTerm}"` : emptyMessage}
            </p>
            <p className="text-sm text-[var(--foreground-subtle)]">
              {searchTerm ? "Try adjusting your search terms" : "Data will appear here when available"}
            </p>
          </div>
        </div>
      </td>
    </tr>
  );

  const totalPages = showPagination ? Math.ceil(sortedData.length / pageSize) : 1;

  // Map legacy rowClassName values to dark theme
  const getRowClass = (item: T, index: number) => {
    if (rowClassName) {
      const customClass = rowClassName(item, index);
      // Map light theme classes to dark theme equivalents
      if (customClass.includes('bg-sky-100') || customClass.includes('bg-blue-100')) {
        return 'bg-[var(--info-muted)] hover:bg-[rgba(59,130,246,0.25)]';
      }
      if (customClass.includes('bg-white')) {
        return '';
      }
      return customClass;
    }
    return '';
  };

  return (
    <div className={`
      bg-[var(--background-secondary)] rounded-xl 
      border border-[var(--border-color)]
      overflow-hidden relative 
      shadow-[var(--shadow-sm)]
      ${className}
    `}>
      {/* Scroll hint — right edge fade */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--background-secondary)] to-transparent pointer-events-none z-10 md:hidden" />
      
      {/* Table container with horizontal scroll */}
      <div className="overflow-x-auto">
        <table className="min-w-[800px] w-full">
          {/* Table header */}
          <thead>
            <tr className="bg-[var(--background-tertiary)] border-b border-[var(--border-color-strong)]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider 
                    text-[var(--foreground-muted)]
                    ${column.sortable ? 'cursor-pointer select-none hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors' : ''}
                    ${column.className || ''}
                  `}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table body */}
          <tbody className="divide-y divide-[var(--border-color)]">
            {isLoading ? (
              <LoadingSkeleton />
            ) : paginatedData.length === 0 ? (
              <EmptyState />
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={index}
                  className={`
                    transition-colors duration-150
                    ${getRowClass(item, index) || 'hover:bg-[var(--hover-bg)]'}
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3.5 text-sm text-[var(--foreground)] ${column.className || ''}`}
                    >
                      {column.accessor(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="bg-[var(--background-tertiary)] border-t border-[var(--border-color-strong)] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[var(--foreground-muted)]">
              Showing <span className="font-medium text-[var(--foreground)]">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-medium text-[var(--foreground)]">{Math.min(currentPage * pageSize, sortedData.length)}</span> of <span className="font-medium text-[var(--foreground)]">{sortedData.length}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-[var(--foreground-muted)] bg-[var(--background-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ←
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`
                        w-8 h-8 text-sm font-medium rounded-lg transition-colors
                        ${currentPage === pageNum 
                          ? 'bg-[var(--accent-primary)] text-white' 
                          : 'text-[var(--foreground-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)]'
                        }
                      `}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-[var(--foreground-muted)] bg-[var(--background-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
