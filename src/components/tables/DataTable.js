'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are currently no items matching your criteria.',
  onRowClick,
  sortField,
  sortDirection,
  onSort,
}) {
  if (isLoading) {
    return <LoadingState message="Fetching data from local repository..." />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
            {columns.map((col, idx) => {
              const isSortable = col.sortable !== false && col.accessorKey;
              const isCurrentSort = sortField === col.accessorKey;

              return (
                <th
                  key={col.id || col.accessorKey || idx}
                  className={cn(
                    'py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-300',
                    isSortable && 'cursor-pointer hover:text-teal-600 transition-colors',
                    col.className
                  )}
                  onClick={() => {
                    if (isSortable && onSort) {
                      onSort(col.accessorKey);
                    }
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {isSortable && (
                      <span className="text-slate-400">
                        {isCurrentSort ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-teal-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-teal-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
          {data.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              onClick={() => onRowClick && onRowClick(row)}
              className={cn(
                'group transition-colors duration-150',
                onRowClick ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50' : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/30'
              )}
            >
              {columns.map((col, colIdx) => {
                const cellValue = col.accessorKey ? row[col.accessorKey] : null;
                return (
                  <td
                    key={col.id || col.accessorKey || colIdx}
                    className={cn('py-3.5 px-4 text-slate-700 dark:text-slate-300 align-middle', col.cellClassName)}
                  >
                    {col.cell ? col.cell({ row, value: cellValue, index: rowIdx }) : cellValue ?? '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
