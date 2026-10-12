'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Search, Download, Plus, RotateCcw } from 'lucide-react';
import { OPERATIONAL_CITIES } from '@/lib/constants';

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search records by name, UHID, ref...',
  statusFilter,
  onStatusChange,
  statusOptions = [],
  cityFilter,
  onCityChange,
  categoryFilter,
  onCategoryChange,
  categoryOptions = [],
  onExport,
  exportFileName = 'mediunify_records',
  onAddClick,
  addLabel = 'Add Record',
  onReset,
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 sm:p-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 rounded-t-2xl">
      {/* Left Filters */}
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        <div className="w-full sm:w-72">
          <Input
            icon={Search}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="py-2 text-xs"
          />
        </div>

        {statusOptions.length > 0 && onStatusChange && (
          <div className="w-full sm:w-36">
            <Select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              options={['All', ...statusOptions]}
              className="py-2 text-xs"
            />
          </div>
        )}

        {onCityChange && (
          <div className="w-full sm:w-36">
            <Select
              value={cityFilter}
              onChange={(e) => onCityChange(e.target.value)}
              options={OPERATIONAL_CITIES}
              className="py-2 text-xs"
            />
          </div>
        )}

        {categoryOptions.length > 0 && onCategoryChange && (
          <div className="w-full sm:w-40">
            <Select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              options={['All', ...categoryOptions]}
              className="py-2 text-xs"
            />
          </div>
        )}

        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs h-9 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5 justify-end">
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            icon={Download}
            className="text-xs h-9 border-slate-200 dark:border-slate-700"
          >
            Export CSV
          </Button>
        )}

        {onAddClick && (
          <Button
            variant="primary"
            size="sm"
            onClick={onAddClick}
            icon={Plus}
            className="text-xs h-9"
          >
            {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
