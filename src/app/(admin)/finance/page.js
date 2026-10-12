'use client';

import React, { useState, useEffect } from 'react';
import { financeRepository } from '@/services/repositories';
import { useLocalFilters } from '@/hooks/useLocalFilters';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/dashboard/StatCard';
import { exportToCSV } from '@/services/exportService';
import { formatCurrency } from '@/lib/formatters';
import { useNotification } from '@/providers/AppProviders';
import {
  Wallet,
  IndianRupee,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  CreditCard,
  Building,
} from 'lucide-react';

export default function FinancePage() {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalVolume: 65000,
    topups: 5000,
    servicePayments: 13600,
    refunds: 800,
    platformRevenueToday: 42800,
    settlementsPending: 18400,
  });

  const {
    data,
    setData,
    paginatedData,
    totalRecords,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
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
    async function loadFinanceData() {
      setLoading(true);
      const [res, summary] = await Promise.all([
        financeRepository.getAll(),
        financeRepository.getSummaryMetrics(),
      ]);
      setData(res.data);
      setMetrics(summary);
      setLoading(false);
    }
    loadFinanceData();
  }, [setData]);

  const handleExport = () => {
    exportToCSV('mediunify_wallet_transactions', data, [
      { header: 'Txn Ref', accessorKey: 'txnRef' },
      { header: 'Patient Name', accessorKey: 'patientName' },
      { header: 'UHID', accessorKey: 'uhid' },
      { header: 'Type', accessorKey: 'type' },
      { header: 'Service Category', accessorKey: 'serviceCategory' },
      { header: 'Amount', accessorKey: 'amount' },
      { header: 'Balance After', accessorKey: 'balanceAfter' },
      { header: 'Gateway', accessorKey: 'paymentGateway' },
      { header: 'Status', accessorKey: 'status' },
      { header: 'Timestamp', accessorKey: 'timestamp' },
    ]);
  };

  const columns = [
    {
      header: 'Txn Ref & Gateway',
      accessorKey: 'txnRef',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
            {row.txnRef}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">{row.paymentGateway}</p>
        </div>
      ),
    },
    {
      header: 'Patient Details',
      accessorKey: 'patientName',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">{row.patientName}</span>
          <p className="font-mono text-[10px] text-slate-400 mt-0.5">{row.uhid}</p>
        </div>
      ),
    },
    {
      header: 'Transaction Type',
      accessorKey: 'type',
      cell: ({ row }) => {
        const isPositive = row.amount > 0;
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {isPositive ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5" /> {row.type}
              </span>
            ) : (
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" /> {row.type}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Category & Notes',
      accessorKey: 'serviceCategory',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{row.serviceCategory}</span>
          <p className="text-[10px] text-slate-400 max-w-xs truncate mt-0.5">{row.notes || '—'}</p>
        </div>
      ),
    },
    {
      header: 'Amount (₹)',
      accessorKey: 'amount',
      cell: ({ row }) => {
        const isPositive = row.amount > 0;
        return (
          <div>
            <span
              className={`font-bold text-sm ${
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {isPositive ? '+' : ''}
              {formatCurrency(row.amount)}
            </span>
            <p className="text-[10px] text-slate-400">Balance: {formatCurrency(row.balanceAfter)}</p>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <Badge status={row.status} size="sm" />,
    },
    {
      header: 'Timestamp',
      accessorKey: 'timestamp',
      cell: ({ row }) => <span className="text-slate-500 text-xs">{row.timestamp}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Financial Ledger & Patient Wallet Transactions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time reconciliation of UPI collections, patient wallet recharges, provider disbursements, and automated refund adjustments.
          </p>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Platform Collections Today"
          value={formatCurrency(metrics.platformRevenueToday)}
          change="+11.4%"
          isPositive={true}
          icon={IndianRupee}
          accentColor="green"
          description="Gross consultations, Rx & scans"
        />
        <StatCard
          title="Provider Settlements Pending"
          value={formatCurrency(metrics.settlementsPending)}
          change="Due in 2 days"
          isPositive={false}
          icon={Building}
          accentColor="navy"
          description="Hospital & pharmacy payouts"
        />
        <StatCard
          title="Patient Wallet Topups"
          value={formatCurrency(metrics.topups)}
          change="Razorpay UPI"
          isPositive={true}
          icon={Wallet}
          accentColor="teal"
          description="In-app prepaid balances"
        />
        <StatCard
          title="Automated Refunds Issued"
          value={formatCurrency(metrics.refunds)}
          change="0 Disputes"
          isPositive={true}
          icon={RotateCcw}
          accentColor="coral"
          description="Cancelled appointments cleared"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by transaction ref, patient, UHID..."
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={['Success', 'Pending', 'Failed']}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          categoryOptions={['Doctor Consultation', 'Pharmacy', 'Diagnostics', 'Platform Wallet']}
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
