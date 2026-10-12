'use client';

import React, { useState, useEffect } from 'react';
import { auditLogsRepository } from '@/services/repositories';
import { useLocalFilters } from '@/hooks/useLocalFilters';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { exportToCSV } from '@/services/exportService';
import { FileText, ShieldAlert, AlertTriangle, Info, Terminal } from 'lucide-react';

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true);

  const {
    data,
    setData,
    paginatedData,
    totalRecords,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    resetFilters,
  } = useLocalFilters([], { defaultSortField: 'timestamp', defaultSortDirection: 'desc' });

  useEffect(() => {
    async function loadAuditLogs() {
      setLoading(true);
      const res = await auditLogsRepository.getAll();
      setData(res.data);
      setLoading(false);
    }
    loadAuditLogs();
  }, [setData]);

  const handleExport = () => {
    exportToCSV('mediunify_audit_logs', data, [
      { header: 'Log Ref', accessorKey: 'logRef' },
      { header: 'Actor Name', accessorKey: 'actorName' },
      { header: 'Actor Role', accessorKey: 'actorRole' },
      { header: 'Action', accessorKey: 'action' },
      { header: 'Target Entity', accessorKey: 'targetEntity' },
      { header: 'Target ID', accessorKey: 'targetId' },
      { header: 'Details', accessorKey: 'details' },
      { header: 'IP Address', accessorKey: 'ipAddress' },
      { header: 'Timestamp', accessorKey: 'timestamp' },
      { header: 'Severity', accessorKey: 'severity' },
    ]);
  };

  const columns = [
    {
      header: 'Log Ref & Severity',
      accessorKey: 'logRef',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
            {row.logRef}
          </span>
          <div className="mt-1">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                row.severity === 'Critical'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : row.severity === 'Warning'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
              }`}
            >
              {row.severity}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Staff Actor',
      accessorKey: 'actorName',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">{row.actorName}</span>
          <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">{row.actorRole}</p>
        </div>
      ),
    },
    {
      header: 'Action Taken',
      accessorKey: 'action',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
          {row.action}
        </span>
      ),
    },
    {
      header: 'Event Activity Details',
      accessorKey: 'details',
      cell: ({ row }) => (
        <div className="max-w-md text-xs text-slate-700 dark:text-slate-300">
          <p className="line-clamp-2 leading-relaxed">{row.details}</p>
          <span className="font-mono text-[10px] text-slate-400 mt-0.5 block">
            Target: {row.targetEntity} #{row.targetId}
          </span>
        </div>
      ),
    },
    {
      header: 'Origin IP & Location',
      accessorKey: 'ipAddress',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
          {row.ipAddress}
        </span>
      ),
    },
    {
      header: 'Timestamp',
      accessorKey: 'timestamp',
      cell: ({ row }) => <span className="text-slate-500 text-xs">{row.timestamp}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Administrative Audit & Security Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable log of all Super Admin interventions, doctor KYC approvals, prescription releases, and emergency fleet dispatches.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search audit trail by actor, action, target entity..."
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={['Info', 'Warning', 'Critical']}
          onExport={handleExport}
          onReset={resetFilters}
        />

        <DataTable
          columns={columns}
          data={paginatedData}
          isLoading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={(field) => {
            setSortField(field);
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          }}
        />

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalItems={totalRecords}
        />
      </div>
    </div>
  );
}
