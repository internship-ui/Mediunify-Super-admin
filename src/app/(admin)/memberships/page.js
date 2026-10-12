'use client';

import React, { useState, useEffect } from 'react';
import { membershipsRepository } from '@/services/repositories';
import { useLocalFilters } from '@/hooks/useLocalFilters';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { exportToCSV } from '@/services/exportService';
import { formatCurrency } from '@/lib/formatters';
import { useNotification } from '@/providers/AppProviders';
import { ShieldCheck, Plus, Check, Star } from 'lucide-react';

export default function MembershipsPage() {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newPlan, setNewPlan] = useState({
    planName: '',
    tier: '',
    priceYearly: '',
    benefits: '',
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
  } = useLocalFilters([], { defaultSortField: 'priceYearly', defaultSortDirection: 'asc' });

  useEffect(() => {
    async function loadMemberships() {
      setLoading(true);
      const res = await membershipsRepository.getAll();
      setData(res.data);
      setLoading(false);
    }
    loadMemberships();
  }, [setData]);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!newPlan.planName) return;

    const created = await membershipsRepository.create({
      ...newPlan,
      priceYearly: Number(newPlan.priceYearly) || 1999,
      activeSubscribers: 0,
      benefits: newPlan.benefits ? newPlan.benefits.split(',').map((s) => s.trim()) : [],
      status: 'Active',
    });

    setData([created, ...data]);
    setIsAddModalOpen(false);
    notify(`Created membership tier ${created.planName}`);
  };

  const handleExport = () => {
    exportToCSV('mediunify_memberships', data, [
      { header: 'Plan Name', accessorKey: 'planName' },
      { header: 'Tier', accessorKey: 'tier' },
      { header: 'Price Yearly', accessorKey: 'priceYearly' },
      { header: 'Active Subscribers', accessorKey: 'activeSubscribers' },
      { header: 'Status', accessorKey: 'status' },
    ]);
  };

  const columns = [
    {
      header: 'Membership Plan',
      accessorKey: 'planName',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 border border-teal-200/50">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100">{row.planName}</span>
            <p className="text-[10px] text-slate-400 font-semibold">{row.tier}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Annual Subscription',
      accessorKey: 'priceYearly',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            {formatCurrency(row.priceYearly)}
          </span>
          <span className="text-[10px] text-slate-400"> / year</span>
        </div>
      ),
    },
    {
      header: 'Active Subscribers',
      accessorKey: 'activeSubscribers',
      cell: ({ row }) => (
        <span className="font-bold text-teal-600 dark:text-teal-400">
          {row.activeSubscribers.toLocaleString()} Patients Enrolled
        </span>
      ),
    },
    {
      header: 'Coverage Benefits',
      accessorKey: 'benefits',
      cell: ({ row }) => (
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5 max-w-sm">
          {row.benefits?.slice(0, 2).map((b, idx) => (
            <li key={idx} className="flex items-center gap-1.5 truncate">
              <Check className="w-3 h-3 text-teal-600 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
          {row.benefits?.length > 2 && (
            <li className="text-[10px] text-slate-400 font-semibold pl-4">
              +{row.benefits.length - 2} more benefits
            </li>
          )}
        </ul>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <Badge status={row.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            MediUnify Care Health Memberships
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Annual preventive healthcare passes, family shield wellness coverage, and subscription tier discounts.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search memberships..."
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={['Active', 'Inactive']}
          onExport={handleExport}
          onAddClick={() => setIsAddModalOpen(true)}
          addLabel="New Plan"
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

      {/* Add Plan Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Membership Plan"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreatePlan}>
              Publish Plan
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
          <Input
            label="Plan Title"
            required
            placeholder="e.g. MediUnify Corporate Wellness"
            value={newPlan.planName}
            onChange={(e) => setNewPlan({ ...newPlan, planName: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tier Label"
              placeholder="e.g. Platinum"
              value={newPlan.tier}
              onChange={(e) => setNewPlan({ ...newPlan, tier: e.target.value })}
            />
            <Input
              label="Annual Price (₹)"
              type="number"
              placeholder="2999"
              value={newPlan.priceYearly}
              onChange={(e) => setNewPlan({ ...newPlan, priceYearly: e.target.value })}
            />
          </div>
          <Input
            label="Benefits (comma separated)"
            placeholder="Free Video OPD, 20% Lab Discount, Priority SOS"
            value={newPlan.benefits}
            onChange={(e) => setNewPlan({ ...newPlan, benefits: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
