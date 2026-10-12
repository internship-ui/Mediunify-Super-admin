'use client';

import React, { useState, useEffect } from 'react';
import { adminUsersRepository } from '@/services/repositories';
import { useLocalFilters } from '@/hooks/useLocalFilters';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { exportToCSV } from '@/services/exportService';
import { useNotification } from '@/providers/AppProviders';
import { ShieldAlert, User, Plus, Shield, CheckCircle2, Lock } from 'lucide-react';

export default function AdminUsersPage() {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Operations Manager',
    department: 'Karnataka Operations Control',
  });

  const {
    data,
    setData,
    paginatedData,
    totalRecords,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
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
  } = useLocalFilters([], { defaultSortField: 'name', defaultSortDirection: 'asc' });

  useEffect(() => {
    async function loadAdminUsers() {
      setLoading(true);
      const res = await adminUsersRepository.getAll();
      setData(res.data);
      setLoading(false);
    }
    loadAdminUsers();
  }, [setData]);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const created = await adminUsersRepository.create({
      ...newUser,
      status: 'Active',
      lastLogin: 'Never',
      permissions: ['standard:access'],
    });

    setData([created, ...data]);
    setIsAddModalOpen(false);
    notify(`Created administrative staff account for ${created.name}`);
  };

  const handleExport = () => {
    exportToCSV('mediunify_admin_users', data, [
      { header: 'Full Name', accessorKey: 'name' },
      { header: 'Email', accessorKey: 'email' },
      { header: 'Phone', accessorKey: 'phone' },
      { header: 'Role', accessorKey: 'role' },
      { header: 'Department', accessorKey: 'department' },
      { header: 'Last Login', accessorKey: 'lastLogin' },
      { header: 'Status', accessorKey: 'status' },
    ]);
  };

  const columns = [
    {
      header: 'Admin Staff Member',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-200/50">
            {row.name.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100">{row.name}</span>
            <p className="text-[10px] text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role & Access Level',
      accessorKey: 'role',
      cell: ({ row }) => {
        const isSuper = row.role === 'Super Admin';
        return (
          <div className="flex items-center gap-1.5">
            {isSuper ? (
              <Shield className="w-3.5 h-3.5 text-teal-600" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span
              className={`font-bold text-xs ${
                isSuper ? 'text-teal-700 dark:text-teal-400' : 'text-slate-800 dark:text-slate-200'
              }`}
            >
              {row.role}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Department',
      accessorKey: 'department',
      cell: ({ row }) => <span className="text-xs text-slate-600 dark:text-slate-400">{row.department}</span>,
    },
    {
      header: 'Contact Phone',
      accessorKey: 'phone',
      cell: ({ row }) => <span className="text-xs text-slate-600 dark:text-slate-400">{row.phone}</span>,
    },
    {
      header: 'Last Active Session',
      accessorKey: 'lastLogin',
      cell: ({ row }) => <span className="text-[11px] text-slate-400">{row.lastLogin}</span>,
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
            Super Admin Users & Access Governance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Internal administrators, clinical directors, pharmacy dispatch controllers, and role-based permissions (RBAC).
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search admin staff by name, email, department..."
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          categoryOptions={['Super Admin', 'Operations Manager', 'Clinical Director', 'Pharmacy Lead', 'Support Agent']}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={['Active', 'Suspended']}
          onExport={handleExport}
          onAddClick={() => setIsAddModalOpen(true)}
          addLabel="Add Admin User"
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

      {/* Add Admin Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Invite New Administrator"
        subtitle="Grants authorized staff access to Karnataka portal modules"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateAdmin}>
              Create Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs">
          <Input
            label="Staff Full Name"
            required
            placeholder="e.g. Ramesh Kumar"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Official Email"
              type="email"
              required
              placeholder="ramesh@mediunify.org"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
            <Input
              label="Phone Number"
              placeholder="+91 98450 00000"
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Role & Privilege"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              options={['Super Admin', 'Operations Manager', 'Clinical Director', 'Pharmacy Lead', 'Support Agent']}
            />
            <Input
              label="Department"
              value={newUser.department}
              onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
